/**
 * FundVerse Cloudflare Worker
 * -----------------------------------------------------------------
 * Replaces Firebase Cloud Functions entirely. Talks to Firestore
 * directly over its REST API using a Google service account (no
 * Blaze plan / no Cloud Functions required — Firestore itself stays
 * on the free Spark plan).
 *
 * Endpoints:
 *   POST /create-order        -> creates a Cashfree order + PENDING doc
 *   POST /verify-payment      -> re-checks status with Cashfree, updates Firestore
 *   POST /webhook             -> Cashfree payment webhook (signature-verified)
 *   POST /submit-manual-upi   -> handles manual UPI submissions, writes to Firestore
 *   GET /public-stats         -> returns current public stats
 *
 * Required secrets (wrangler secret put ...):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY      (PEM, keep the \n escapes literal)
 *   CASHFREE_APP_ID
 *   CASHFREE_SECRET_KEY
 *   RECAPTCHA_SECRET_KEY
 *
 * Required vars (wrangler.jsonc "vars"):
 *   CASHFREE_ENV   "sandbox" | "production"
 *   SITE_URL       e.g. https://fundverse.app
 *   ALLOWED_ORIGIN e.g. https://fundverse.app
 */

const COLLECTION = "ComicProjectDonations";
const STATS_DOC_PATH = "PublicStats/CampaignTotals";
const WEBHOOK_EVENTS = "WebhookEvents";

// ---------------------------------------------------------------
// CORS
// ---------------------------------------------------------------
function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS", // Added GET for public-stats
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(env) },
  });
}

// ---------------------------------------------------------------
// Google service-account auth (JWT -> OAuth2 access token)
// ---------------------------------------------------------------
let cachedToken = null; // { token, expiresAt } — reused across requests in the same isolate

function base64url(bytes) {
  let str = typeof bytes === "string" ? bytes : String.fromCharCode(...new Uint8Array(bytes));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) {
    return cachedToken.token;
  }

  const privateKeyPem = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: env.FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsigned)
  );
  const jwt = `${unsigned}.${base64url(signature)}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    throw new Error(`Google token exchange failed: ${await resp.text()}`);
  }

  const data = await resp.json();
  cachedToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

// ---------------------------------------------------------------
// Firestore REST helpers
// ---------------------------------------------------------------
function firestoreBaseUrl(env) {
  return `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents`;
}

function toFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") {
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  }
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) {
    return { arrayValue: { values: v.map(toFirestoreValue) } };
  }
  if (typeof v === "object") {
    return { mapValue: { fields: toFirestoreFields(v) } };
  }
  return { stringValue: String(v) };
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [k, val] of Object.entries(obj)) {
    fields[k] = toFirestoreValue(val);
  }
  return fields;
}

function fromFirestoreValue(v) {
  if (!v) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  if ("mapValue" in v) return fromFirestoreFields(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  return null;
}

function fromFirestoreFields(fields) {
  const obj = {};
  for (const [k, v] of Object.entries(fields || {})) {
    obj[k] = fromFirestoreValue(v);
  }
  return obj;
}

async function firestoreGet(env, path) {
  const token = await getAccessToken(env);
  const resp = await fetch(`${firestoreBaseUrl(env)}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Firestore GET ${path} failed: ${await resp.text()}`);
  const data = await resp.json();
  return { fields: fromFirestoreFields(data.fields), raw: data };
}

// Creates a doc with a specific ID. Fails with 409 if it already
// exists — used deliberately for the webhook idempotency ledger.
async function firestoreCreate(env, collectionPath, docId, data) {
  const token = await getAccessToken(env);
  const resp = await fetch(
    `${firestoreBaseUrl(env)}/${collectionPath}?documentId=${encodeURIComponent(docId)}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    }
  );
  return resp; // caller checks resp.ok / resp.status === 409
}

// Adds a doc with an auto-generated ID
async function firestoreAdd(env, collectionPath, data) {
  const token = await getAccessToken(env);
  const resp = await fetch(
    `${firestoreBaseUrl(env)}/${collectionPath}`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    }
  );
  if (!resp.ok) throw new Error(`Firestore ADD ${collectionPath} failed: ${await resp.text()}`);
  const result = await resp.json();
  return { id: result.name.split('/').pop(), fields: fromFirestoreFields(result.fields) };
}

// Upserts (merge) a doc at an exact path using updateMask so
// unspecified fields are left untouched — mirrors Admin SDK's
// `.set(data, { merge: true })`.
async function firestoreSet(env, path, data) {
  const token = await getAccessToken(env);
  const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const resp = await fetch(`${firestoreBaseUrl(env)}/${path}?${mask}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFirestoreFields(data) }),
  });
  if (!resp.ok) throw new Error(`Firestore SET ${path} failed: ${await resp.text()}`);
  return resp.json();
}

// Queries documents in a collection
async function firestoreQuery(env, collectionPath) {
  const token = await getAccessToken(env);
  const resp = await fetch(`${firestoreBaseUrl(env)}/${collectionPath}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`Firestore QUERY ${collectionPath} failed: ${await resp.text()}`);
  const data = await resp.json();
  return (data.documents || []).map(doc => ({ id: doc.name.split('/').pop(), fields: fromFirestoreFields(doc.fields) }));
}

// ---------------------------------------------------------------
// Public Stats Management
// ---------------------------------------------------------------
function isCounted(status) {
  return status === "SUCCESS" || status === "confirmed";
}

async function updatePublicStats(env, amountDelta, countDelta) {
  const statsDocPath = STATS_DOC_PATH;
  const token = await getAccessToken(env);

  // Check if PublicStats/CampaignTotals exists
  const existingStats = await firestoreGet(env, statsDocPath);

  if (!existingStats) {
    // If it doesn't exist, perform migration
    console.log("PublicStats/CampaignTotals not found. Performing initial migration.");
    const allDonations = await firestoreQuery(env, COLLECTION);
    let initialTotalRaised = 0;
    let initialContributorCount = 0;

    for (const donation of allDonations) {
      if (isCounted(donation.fields.status)) {
        initialTotalRaised += Number(donation.fields.amount) || 0;
        initialContributorCount += 1;
      }
    }

    // Create the document with initial values
    await firestoreSet(env, statsDocPath, {
      totalRaised: initialTotalRaised,
      contributorCount: initialContributorCount,
      updatedAt: new Date().toISOString(),
    });
    console.log(`PublicStats/CampaignTotals initialized with totalRaised: ${initialTotalRaised}, contributorCount: ${initialContributorCount}`);
  }

  // Atomically increments numeric fields on a doc (creates the doc if
  // missing) using Firestore's native increment field transform via
  // the :commit endpoint — this is what keeps PublicStats/CampaignTotals
  // race-free under concurrent payments.
  const fieldTransforms = [
    { fieldPath: "totalRaised", increment: { doubleValue: amountDelta } },
    { fieldPath: "contributorCount", increment: { integerValue: countDelta } },
    { fieldPath: "updatedAt", setToServerValue: "REQUEST_TIME" },
  ];

  const resp = await fetch(`${firestoreBaseUrl(env)}:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      writes: [
        {
          transform: {
            document: `projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${statsDocPath}`,
            fieldTransforms: fieldTransforms,
          },
        },
      ],
    }),
  });

  if (!resp.ok) {
    throw new Error(`Firestore INCREMENT ${statsDocPath} failed: ${await resp.text()}`);
  }
}

// ---------------------------------------------------------------
// Cashfree helpers
// ---------------------------------------------------------------
function cashfreeBaseUrl(env) {
  return env.CASHFREE_ENV === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders(env) {
  return {
    "x-client-id": env.CASHFREE_APP_ID,
    "x-client-secret": env.CASHFREE_SECRET_KEY,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };
}

async function createCashfreeOrder(env, { orderId, amount, name, email, phone }) {
  const resp = await fetch(`${cashfreeBaseUrl(env)}/orders`, {
    method: "POST",
    headers: cashfreeHeaders(env),
    body: JSON.stringify({
      order_id: orderId,
      order_amount: amount,
      order_currency: "INR",
      customer_details: {
        customer_id: `cust_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
        customer_name: name,
        customer_email: email,
        customer_phone: phone,
      },
      order_meta: {
        return_url: `${env.SITE_URL}/index.html?order_id={order_id}`,
      },
    }),
  });
  if (!resp.ok) throw new Error(`Cashfree create order failed: ${await resp.text()}`);
  return resp.json();
}

async function getCashfreeOrderStatus(env, orderId) {
  const resp = await fetch(`${cashfreeBaseUrl(env)}/orders/${orderId}`, {
    headers: cashfreeHeaders(env),
  });
  if (!resp.ok) throw new Error(`Cashfree get order failed: ${await resp.text()}`);
  return resp.json();
}

// ---------------------------------------------------------------
// Shared: verify with Cashfree, write Firestore, keep totals in sync
// ---------------------------------------------------------------
async function fetchAndRecordOrderStatus(env, orderId) {
  const docPath = `${COLLECTION}/${orderId}`;
  const before = await firestoreGet(env, docPath);
  const beforeStatus = before?.fields?.status || null;
  const amount = before?.fields?.amount || 0;

  const order = await getCashfreeOrderStatus(env, orderId);
  const raw = order.order_status; // ACTIVE | PAID | EXPIRED | TERMINATED

  let status = "PENDING";
  if (raw === "PAID") status = "SUCCESS";
  else if (raw === "EXPIRED" || raw === "TERMINATED") status = "FAILED";

  await firestoreSet(env, docPath, {
    status,
    orderStatusRaw: raw,
    verifiedAt: new Date().toISOString(), // Add verifiedAt for consistency
  });

  const wasCounted = isCounted(beforeStatus);
  const isNowCounted = isCounted(status);

  if (wasCounted !== isNowCounted) {
    const amountDelta = isNowCounted ? Number(amount) : -Number(amount);
    const countDelta = isNowCounted ? 1 : -1;
    await updatePublicStats(env, amountDelta, countDelta);
  }

  return status;
}

// ---------------------------------------------------------------
// reCAPTCHA verification
// ---------------------------------------------------------------
async function verifyRecaptcha(env, token, remoteIp) {
  if (!token || typeof token !== "string") return false;

  const params = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: token,
  });
  if (remoteIp) params.set("remoteip", remoteIp);

  const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!resp.ok) return false;
  const data = await resp.json();
  return data.success === true;
}

// ---------------------------------------------------------------
// Request validation helpers
// ---------------------------------------------------------------
function isValidPhone(phone) {
  return typeof phone === "string" && /^[0-9]{6,15}$/.test(phone);
}
function isValidCountryCode(cc) {
  return typeof cc === "string" && /^\+[0-9]{1,4}$/.test(cc);
}

// ---------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------
async function handleCreateOrder(req, env) {
  const body = await req.json().catch(() => ({}));
  const { name, email, countryCode, phone, amount, consentAccepted, recaptchaToken } = body;

  if (!name || !email || !amount || Number(amount) <= 0) {
    return json({ error: "Missing or invalid donation details." }, 400, env);
  }
  if (!consentAccepted) {
    return json({ error: "Consent to Terms & Privacy Policy is required." }, 400, env);
  }

  const remoteIp = req.headers.get("CF-Connecting-IP");
  const recaptchaOk = await verifyRecaptcha(env, recaptchaToken, remoteIp);
  if (!recaptchaOk) {
    return json({ error: "reCAPTCHA verification failed. Please try again." }, 400, env);
  }

  const cleanPhone = String(phone || "").replace(/\D/g, "");
  if (!isValidPhone(cleanPhone)) {
    return json({ error: "A valid mobile number is required for online payment." }, 400, env);
  }
  const cleanCountryCode = isValidCountryCode(countryCode) ? countryCode : "+91";

  const orderId = `fv_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;

  const order = await createCashfreeOrder(env, {
    orderId,
    amount: Number(amount),
    name,
    email,
    phone: cleanPhone,
  });

  await firestoreSet(env, `${COLLECTION}/${orderId}`, {
    name,
    email,
    countryCode: cleanCountryCode,
    phone: cleanPhone,
    amount: Number(amount),
    paymentMethod: "cashfree",
    status: "PENDING",
    consentAccepted: true,
    orderId,
    date: new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
      timeZone: "Asia/Kolkata",
    }),
    timestamp: new Date(),
  });

  return json({ orderId, paymentSessionId: order.payment_session_id }, 200, env);
}

async function handleVerifyPayment(req, env) {
  const body = await req.json().catch(() => ({}));
  const { orderId } = body;
  if (!orderId) return json({ error: "Missing orderId." }, 400, env);

  try {
    const status = await fetchAndRecordOrderStatus(env, orderId);
    return json({ status }, 200, env);
  } catch (err) {
    console.error("verify-payment error:", err.message);
    return json({ error: "Could not verify payment." }, 500, env);
  }
}

async function handleWebhook(req, env) {
  const signature = req.headers.get("x-webhook-signature");
  const timestamp = req.headers.get("x-webhook-timestamp");
  const rawBody = await req.text();

  if (!signature || !timestamp) {
    return json({ error: "Missing signature headers" }, 400, env);
  }

  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 600) {
    return json({ error: "Stale request" }, 401, env);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(env.CASHFREE_SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  const expectedStd = btoa(String.fromCharCode(...new Uint8Array(sigBuffer)));

  if (signature !== expectedStd) {
    return json({ error: "Invalid signature" }, 401, env);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400, env);
  }

  const orderId = payload?.data?.order?.order_id;
  if (!orderId) return json({ error: "Missing order_id" }, 400, env);

  // Idempotency: creating this doc fails with 409 if the exact same
  // event was already delivered, so duplicate webhook deliveries are
  // detected and skipped without touching the donation record again.
  const eventId = `${orderId}_${timestamp}`;
  const createResp = await firestoreCreate(env, WEBHOOK_EVENTS, eventId, {
    orderId,
    receivedAt: new Date().toISOString(),
  });

  if (createResp.status === 409) {
    return json({ status: "already processed" }, 200, env);
  }
  if (!createResp.ok) {
    console.error("WebhookEvents write failed:", await createResp.text());
  }

  try {
    await fetchAndRecordOrderStatus(env, orderId);
    return json({ status: "ok" }, 200, env);
  } catch (err) {
    console.error("webhook processing error:", err.message);
    return json({ error: "Webhook processing failed" }, 500, env);
  }
}

async function handleManualUpiSubmission(req, env) {
  const body = await req.json().catch(() => ({}));
  const { name, email, phone, countryCode, amount, txnID, consentAccepted, recaptchaToken } = body;

  if (!name || !email || !amount || Number(amount) <= 0 || !txnID) {
    return json({ error: "Missing or invalid donation details." }, 400, env);
  }
  if (!consentAccepted) {
    return json({ error: "Consent to Terms & Privacy Policy is required." }, 400, env);
  }

  const remoteIp = req.headers.get("CF-Connecting-IP");
  const recaptchaOk = await verifyRecaptcha(env, recaptchaToken, remoteIp);
  if (!recaptchaOk) {
    return json({ error: "reCAPTCHA verification failed. Please try again." }, 400, env);
  }

  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const cleanCountryCode = isValidCountryCode(countryCode) ? countryCode : "+91";

  try {
    const newDoc = await firestoreAdd(env, COLLECTION, {
      name,
      email,
      ...(cleanPhone ? { countryCode: cleanCountryCode, phone: cleanPhone } : {}),
      amount: Number(amount),
      txnID,
      date: new Date().toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
        timeZone: "Asia/Kolkata",
      }),
      paymentMethod: "manual-upi",
      status: "confirmed", // Manual UPI is confirmed on submission
      consentAccepted: true,
      timestamp: new Date(),
    });

    // Update public stats immediately for manual UPI
    await updatePublicStats(env, Number(amount), 1);

    return json({ status: "SUCCESS", docId: newDoc.id }, 200, env);
  } catch (error) {
    console.error("Manual UPI submission error:", error);
    return json({ error: "Failed to record manual UPI contribution." }, 500, env);
  }
}

async function handleGetPublicStats(req, env) {
  try {
    const stats = await firestoreGet(env, STATS_DOC_PATH);
    if (stats) {
      return json(stats.fields, 200, env);
        } else {
      console.log("PublicStats/CampaignTotals not found during GET request. Attempting initial migration.");

      await updatePublicStats(env, 0, 0);

      const migratedStats = await firestoreGet(env, STATS_DOC_PATH);

      return json(
        migratedStats?.fields || {
          totalRaised: 0,
          contributorCount: 0,
        },
        200,
        env
      );
    }
  } catch (error) {
    console.error("Error fetching public stats:", error);
    return json({ error: "Could not retrieve public stats." }, 500, env);
  }
}

// ---------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env) });
    }

    try {
      if (request.method === "POST" && url.pathname === "/create-order") {
        return await handleCreateOrder(request, env);
      }
      if (request.method === "POST" && url.pathname === "/verify-payment") {
        return await handleVerifyPayment(request, env);
      }
      if (request.method === "POST" && url.pathname === "/webhook") {
        return await handleWebhook(request, env);
      }
      if (request.method === "POST" && url.pathname === "/submit-manual-upi") {
        return await handleManualUpiSubmission(request, env);
      }
      if (request.method === "GET" && url.pathname === "/public-stats") {
        return await handleGetPublicStats(request, env);
      }
      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true }, 200, env);
      }
      return json({ error: "Not found" }, 404, env);
    } catch (err) {
      console.error("Unhandled worker error:", err.message);
      return json({ error: "Internal server error" }, 500, env);
    }
  },
};