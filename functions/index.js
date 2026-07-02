const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// --- Secrets (set these via CLI, never commit them) ---
// firebase functions:secrets:set CASHFREE_APP_ID
// firebase functions:secrets:set CASHFREE_SECRET_KEY
const CASHFREE_APP_ID = defineSecret("CASHFREE_APP_ID");
const CASHFREE_SECRET_KEY = defineSecret("CASHFREE_SECRET_KEY");

// --- Config params (set via `firebase functions:config` or defaults below) ---
// CASHFREE_ENV: "sandbox" while testing, "production" when live.
// firebase deploy --only functions --set-params CASHFREE_ENV=sandbox,SITE_URL=https://your-test-domain.web.app
const CASHFREE_ENV = defineString("CASHFREE_ENV", { default: "sandbox" });
const SITE_URL = defineString("SITE_URL", { default: "https://fundverse.app" });

const CASHFREE_API_VERSION = "2023-08-01";
const COLLECTION = "ComicProjectDonations";

function getBaseUrl() {
  return CASHFREE_ENV.value() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

function cashfreeHeaders(appId, secretKey) {
  return {
    "x-client-id": appId,
    "x-client-secret": secretKey,
    "x-api-version": CASHFREE_API_VERSION,
    "Content-Type": "application/json",
  };
}

/**
 * Callable function: creates a Cashfree order and returns only the
 * payment_session_id to the browser. Client Secret/App ID stay on
 * the server at all times.
 */
exports.createCashfreeOrder = onCall(
  { secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY] },
  async (request) => {
    const { name, email, countryCode, phone, amount, consentAccepted } = request.data || {};

    if (!name || !email || !amount || Number(amount) <= 0) {
      throw new HttpsError("invalid-argument", "Missing or invalid donation details.");
    }

    if (consentAccepted !== true) {
      throw new HttpsError("failed-precondition", "Terms & Conditions must be accepted before contributing.");
    }

    // Cashfree's Orders API mandates a real customer phone number —
    // there is no supported way to create an order without one.
    // Digits-only, 6-15 length to accommodate the country-code
    // selector's non-Indian numbers; India-specific stricter checks
    // happen implicitly since Cashfree's own risk engine validates
    // the final number.
    const cleanPhone = String(phone || "").replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 6 || cleanPhone.length > 15) {
      throw new HttpsError("invalid-argument", "A valid mobile number is required for online payment.");
    }
    const cleanCountryCode = /^\+[0-9]{1,4}$/.test(countryCode) ? countryCode : "+91";

    const orderId = `fv_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    try {
      const response = await axios.post(
        `${getBaseUrl()}/orders`,
        {
          order_id: orderId,
          order_amount: Number(amount),
          order_currency: "INR",
          customer_details: {
            customer_id: `cust_${crypto.randomBytes(6).toString("hex")}`,
            customer_name: name,
            customer_email: email,
            // Cashfree's PG is built around Indian mobile numbers;
            // international donor numbers are stored for your
            // records (see below) but may not always be accepted by
            // Cashfree itself — test non-Indian numbers in sandbox
            // before relying on this for a global audience.
            customer_phone: cleanPhone,
          },
          order_meta: {
            // Cashfree appends order_id automatically on redirect.
            return_url: `${SITE_URL.value()}/index.html?order_id={order_id}`,
          },
        },
        { headers: cashfreeHeaders(CASHFREE_APP_ID.value(), CASHFREE_SECRET_KEY.value()) }
      );

      // Create a pending record now so it shows up in the admin
      // panel as "pending" and can be reconciled if verification
      // never completes on the client (e.g. tab closed). Only
      // authenticated admins can ever read this collection (see
      // firestore.rules), so it's safe to store the phone number here.
      await db.collection(COLLECTION).doc(orderId).set({
        name,
        email,
        countryCode: cleanCountryCode,
        phone: cleanPhone,
        amount: Number(amount),
        paymentMethod: "cashfree",
        status: "PENDING",
        orderId,
        consentAccepted: true,
        date: new Date().toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        }),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        orderId,
        paymentSessionId: response.data.payment_session_id,
      };
    } catch (err) {
      console.error("createCashfreeOrder error:", err.response ? err.response.data : err.message);
      throw new HttpsError("internal", "Could not create Cashfree order.");
    }
  }
);

/**
 * Callable function: called by the browser after Cashfree redirects
 * back. It independently asks Cashfree's server API for the true
 * order status (never trusts client-supplied status) and updates
 * Firestore accordingly.
 */
exports.verifyCashfreePayment = onCall(
  { secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY] },
  async (request) => {
    const { orderId } = request.data || {};
    if (!orderId) {
      throw new HttpsError("invalid-argument", "Missing orderId.");
    }

    try {
      const status = await fetchAndRecordOrderStatus(orderId);
      return { status };
    } catch (err) {
      console.error("verifyCashfreePayment error:", err.response ? err.response.data : err.message);
      throw new HttpsError("internal", "Could not verify payment.");
    }
  }
);

/**
 * HTTP webhook: configure this URL in the Cashfree dashboard as the
 * "Payment webhook". This is the authoritative source of truth and
 * works even if the customer never returns to the site. Verifies the
 * webhook signature before trusting the payload.
 */
exports.cashfreeWebhook = onRequest(
  { secrets: [CASHFREE_APP_ID, CASHFREE_SECRET_KEY] },
  async (req, res) => {
    try {
      const signature = req.headers["x-webhook-signature"];
      const timestamp = req.headers["x-webhook-timestamp"];
      const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

      if (!signature || !timestamp) {
        res.status(400).send("Missing signature headers");
        return;
      }

      // Reject stale/replayed requests — a captured, valid-signature
      // webhook older than 10 minutes is refused even though the
      // signature itself still checks out.
      const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
      if (!Number.isFinite(ageSeconds) || ageSeconds > 600) {
        console.warn("Cashfree webhook timestamp too old — rejecting (possible replay).");
        res.status(401).send("Stale request");
        return;
      }

      const expected = crypto
        .createHmac("sha256", CASHFREE_SECRET_KEY.value())
        .update(timestamp + rawBody)
        .digest("base64");

      if (expected !== signature) {
        console.warn("Cashfree webhook signature mismatch — rejecting.");
        res.status(401).send("Invalid signature");
        return;
      }

      const orderId = req.body?.data?.order?.order_id;
      if (!orderId) {
        res.status(400).send("Missing order_id");
        return;
      }

      // Explicit duplicate-delivery guard: Cashfree (like most
      // webhook providers) may deliver the same event more than
      // once. Record each unique (orderId, timestamp) pair once via
      // a transactional create — a second delivery of the exact same
      // event hits "already exists" and is skipped without touching
      // the donation record again.
      const eventId = `${orderId}_${timestamp}`;
      const eventRef = db.collection("WebhookEvents").doc(eventId);
      const alreadyProcessed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(eventRef);
        if (snap.exists) return true;
        tx.set(eventRef, {
          orderId,
          receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        return false;
      });

      if (alreadyProcessed) {
        res.status(200).send("Already processed");
        return;
      }

      await fetchAndRecordOrderStatus(orderId);
      res.status(200).send("OK");
    } catch (err) {
      console.error("cashfreeWebhook error:", err.message);
      res.status(500).send("Webhook processing failed");
    }
  }
);

/**
 * Shared helper: fetches the authoritative order status from
 * Cashfree's server API and writes/updates the Firestore donation
 * record only when the payment is genuinely SUCCESS/FAILED, never
 * from client-supplied claims.
 */
async function fetchAndRecordOrderStatus(orderId) {
  const response = await axios.get(`${getBaseUrl()}/orders/${orderId}`, {
    headers: cashfreeHeaders(CASHFREE_APP_ID.value(), CASHFREE_SECRET_KEY.value()),
  });

  const orderStatus = response.data.order_status; // ACTIVE | PAID | EXPIRED | TERMINATED
  const docRef = db.collection(COLLECTION).doc(orderId);

  let status = "PENDING";
  if (orderStatus === "PAID") status = "SUCCESS";
  else if (orderStatus === "EXPIRED" || orderStatus === "TERMINATED") status = "FAILED";

  await docRef.set(
    {
      status,
      orderStatusRaw: orderStatus,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return status;
}

// --- Statuses that count toward the public campaign total ---
function isCounted(status) {
  return status === "SUCCESS" || status === "confirmed";
}

/**
 * Firestore trigger: keeps a single public document,
 * PublicStats/CampaignTotals, in sync with the donations collection.
 * This is what the public site reads for the progress bar instead
 * of querying ComicProjectDonations directly — donor names, emails,
 * and transaction IDs are never exposed to the browser this way.
 * Runs under the Admin SDK, so it is unaffected by Firestore rules.
 */
exports.onDonationWrite = onDocumentWritten(
  `${COLLECTION}/{donationId}`,
  async (event) => {
    const before = event.data.before.exists ? event.data.before.data() : null;
    const after = event.data.after.exists ? event.data.after.data() : null;

    const wasCounted = before ? isCounted(before.status) : false;
    const isNowCounted = after ? isCounted(after.status) : false;

    // No change in whether this record counts toward the public
    // total (e.g. PENDING -> PENDING, or a field edit that doesn't
    // touch status) — nothing to update.
    if (wasCounted === isNowCounted) return;

    const amountDelta = isNowCounted
      ? Number(after.amount || 0)
      : -Number(before.amount || 0);
    const countDelta = isNowCounted ? 1 : -1;

    const statsRef = db.collection("PublicStats").doc("CampaignTotals");
    await statsRef.set(
      {
        totalRaised: admin.firestore.FieldValue.increment(amountDelta),
        contributorCount: admin.firestore.FieldValue.increment(countDelta),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }
);
