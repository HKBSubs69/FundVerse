// --- Cloudflare Worker as Backend ---
// All payment operations (Cashfree, Manual UPI) and public stats
// are now handled by the FundVerse Cloudflare Worker. This avoids
// direct client-side interaction with Firestore for these operations,
// enhancing security and centralizing backend logic.
// Firestore itself is unaffected; it stays on the free Spark plan
// and continues to hold all donation data, accessed only by the Worker
// and the authenticated Admin Panel.

// --- Cloudflare Worker base URL ---
const WORKER_URL = "https://fundverse-worker.blueoceanstudiosindia.workers.dev";

async function callWorker(path, payload, method = "POST") {
  let resp;
  try {
    resp = await fetch(`${WORKER_URL}${path}`, {
  method,
  headers: {
    "Content-Type": "application/json",
  },
  ...(payload !== null && payload !== undefined
    ? { body: JSON.stringify(payload) }
    : {}),
});
  } catch (networkErr) {
    console.error(`Network error calling ${path}:`, networkErr);
    throw new Error("Could not reach the server. Check your connection and try again.");
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || `Worker request to ${path} failed (${resp.status}).`);
  }
  return data;
}

// --- Constants ---
const goalAmount = 20000;
const upiID = "7079441779@ikwik";
// Set to "production" only after your Worker is deployed with
// CASHFREE_ENV=production and live Cashfree keys.
const CASHFREE_MODE = "production";
const PENDING_KEY = "fundverse_pending_order";

// --- Load QRCode Library ---
const qrScript = document.createElement("script");
qrScript.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
document.head.appendChild(qrScript);

// --- Loader Sentences ---
const lines = [
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels a dream.",
  "Together, we make imagination real.",
  "Fueling art, passion, and purpose — one contribution at a time.",
];

// --- Show Loader Once ---
function showLoading() {
  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loading-text");
  const main = document.getElementById("main-content");

  if (!loader || !textEl || !main) {
    if (main) main.classList.remove("hidden");
    return;
  }

  const line = lines[Math.floor(Math.random() * lines.length)];
  textEl.textContent = "";
  let i = 0;

  function type() {
    if (i < line.length) {
      textEl.textContent += line.charAt(i);
      i++;
      setTimeout(type, 55);
    } else {
      setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.9s ease";
        setTimeout(() => {
          loader.style.display = "none";
          main.classList.remove("hidden");
          main.style.opacity = "1";
        }, 800);
      }, 900);
    }
  }
  type();
}

// --- Payment Logic ---
document.addEventListener("DOMContentLoaded", () => {
  showLoading();

  const form = document.getElementById("donationForm");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");
  const paymentOption = document.getElementById("payment-option");
  const paymentMethod = document.getElementById("payment-method");
  const manualUpiFields = document.getElementById("manual-upi-fields");
  const cashfreeHint = document.getElementById("cashfree-hint");
  const txnIdInput = document.getElementById("txnId");
  const phoneInput = document.getElementById("phone");
  const countryCodeSelect = document.getElementById("country-code");
  const consentCheckbox = document.getElementById("consent-checkbox");
  const contributeBtn = document.getElementById("contributeBtn");

  // --- Update Progress Bar ---
  // Reads a single public aggregate document from the Cloudflare Worker.
  async function updateProgress() {
    try {
      const stats = await callWorker("/public-stats", null, "GET");
      const total = Number(stats.totalRaised) || 0;
      const percent = Math.min((total / goalAmount) * 100, 100);
      progressBar.style.width = `${percent}%`;
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString(
        "en-IN"
      )} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (err) {
      console.error("Error updating progress:", err);
      // Optionally, display a message to the user that stats could not be loaded
    }
  }

  // --- Toggle Payment Method Fields ---
  if (paymentMethod) {
    paymentMethod.addEventListener("change", (e) => {
      const method = e.target.value;

      if (method === "manual-upi") {
        manualUpiFields.classList.remove("hidden");
        cashfreeHint.classList.add("hidden");
        txnIdInput.setAttribute("required", "required");
        phoneInput.removeAttribute("required");
        contributeBtn.textContent = "Contribute";
      } else if (method === "cashfree") {
        manualUpiFields.classList.add("hidden");
        upiDisplay.classList.add("hidden");
        cashfreeHint.classList.remove("hidden");
        txnIdInput.removeAttribute("required");
        phoneInput.setAttribute("required", "required");
        contributeBtn.textContent = "Proceed to Payment";
      } else {
        manualUpiFields.classList.add("hidden");
        cashfreeHint.classList.add("hidden");
        txnIdInput.removeAttribute("required");
        phoneInput.removeAttribute("required");
        contributeBtn.textContent = "Contribute";
      }
    });
  }

  // --- Handle Manual UPI Option Change (unchanged behaviour) ---
  if (paymentOption) {
    paymentOption.addEventListener("change", async (e) => {
      const option = e.target.value;
      const amount = document.getElementById("amount").value.trim();

      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        e.target.value = "";
        return;
      }

      upiDisplay.classList.remove("hidden");

      await new Promise((resolve) => {
        if (window.QRCode) resolve();
        else qrScript.onload = resolve;
      });

      const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;

      if (option === "upi-id") {
        qrCanvas.style.display = "none";
        upiText.style.display = "block";
        upiText.innerHTML = `
          <strong>Send Payment To:</strong><br>
          <span style="color:#3b82f6;font-weight:600;">${upiID}</span>`;
        upiText.onclick = () => (window.location.href = qrData);
      } else if (option === "upi-qr") {
        upiText.textContent = "Scan this QR to Pay:";
        qrCanvas.style.display = "block";
        const ctx = qrCanvas.getContext("2d");
        ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        QRCode.toCanvas(qrCanvas, qrData, { width: 200 });
      }
    });
  }

  // --- Handle Form Submission ---
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const amount = parseFloat(document.getElementById("amount").value);
      const method = paymentMethod ? paymentMethod.value : "";
      const countryCode = countryCodeSelect ? countryCodeSelect.value : "+91";
      const phoneRaw = phoneInput.value.trim();
      const recaptchaResponse = window.grecaptcha ? window.grecaptcha.getResponse() : "";

      if (!name || !email || !amount || !method) {
        alert("Please fill all fields!");
        return;
      }

      if (!consentCheckbox || !consentCheckbox.checked) {
        alert("Please accept the Terms & Conditions, Privacy Policy, and Refund Policy to continue.");
        return;
      }

      if (window.grecaptcha && !recaptchaResponse) {
        alert("Please verify the reCAPTCHA before continuing.");
        return;
      }

      // Phone is optional for Manual UPI but, if entered, should
      // still be a plausible number. Digits-only check; length kept
      // loose (6-15) since the country code selector supports
      // multiple countries with differing local number lengths.
      if (phoneRaw && !/^[0-9]{6,15}$/.test(phoneRaw)) {
        alert("Please enter a valid mobile number (digits only).");
        return;
      }

      if (method === "manual-upi") {
        const txnID = txnIdInput.value.trim();
        if (!txnID) {
          alert("Please enter your Transaction ID.");
          return;
        }

        try {
          await callWorker("/submit-manual-upi", {
            name,
            email,
            countryCode,
            phone: phoneRaw,
            amount,
            txnID,
            consentAccepted: true,
            recaptchaToken: recaptchaResponse,
          });
          alert("🎉 Thank you for your contribution! Your contribution will reflect shortly.");
          form.reset();
          upiDisplay.classList.add("hidden");
          manualUpiFields.classList.add("hidden");
          if (window.grecaptcha) window.grecaptcha.reset();
          updateProgress(); // Update progress bar after successful submission
        } catch (error) {
          console.error("Error adding donation:", error);
          alert(error.message || "Something went wrong. Try again!");
        }
        return;
      }

      if (method === "cashfree") {
        if (!phoneRaw) {
          alert("Please enter your mobile number to continue with online payment.");
          return;
        }

        contributeBtn.disabled = true;
        contributeBtn.textContent = "Redirecting to payment...";

        try {
          // Ask the Cloudflare Worker to create a Cashfree order. The
          // Cashfree Client Secret / App ID never touch the browser —
          // the Worker creates the order server-side and returns
          // only a payment_session_id.
          const result = await callWorker("/create-order", {
            name,
            email,
            countryCode,
            phone: phoneRaw,
            amount,
            consentAccepted: true,
            recaptchaToken: recaptchaResponse,
          });

          const { paymentSessionId, orderId } = result;
          if (!paymentSessionId || !orderId) {
            throw new Error("Could not create payment order.");
          }

          // Save minimal donor info locally so the return page can
          // finish the flow after Cashfree redirects back.
          sessionStorage.setItem(
            PENDING_KEY,
            JSON.stringify({ orderId, name, email, amount })
          );

          const cashfree = window.Cashfree({ mode: CASHFREE_MODE });
          cashfree.checkout({
            paymentSessionId,
            redirectTarget: "_self",
          });
        } catch (error) {
          console.error("Cashfree order error:", error);
          alert(error.message || "Unable to start payment. Please try again.");
          if (window.grecaptcha) window.grecaptcha.reset();
          contributeBtn.disabled = false;
          contributeBtn.textContent = "Proceed to Payment";
        }
        return;
      }
    });
  }

  // --- Handle Cashfree Redirect Back (order_id in URL) ---
  async function handleCashfreeReturn() {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order_id");
    if (!orderId) return;

    try {
      // The Worker re-checks the order status directly with
      // Cashfree's server API (never trusting the URL/query params
      // alone) before writing anything to Firestore.
      const result = await callWorker("/verify-payment", { orderId });
      const { status } = result;

      if (status === "SUCCESS") {
        alert("🎉 Thank you for your contribution! Your contribution will reflect shortly.");
      } else if (status === "PENDING") {
        alert("Your payment is still processing. It will reflect shortly.");
      } else {
        alert("Payment failed or was cancelled. Please try again.");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      alert("We couldn't verify your payment. If money was deducted, contact us.");
    } finally {
      sessionStorage.removeItem(PENDING_KEY);
      // Clean the order_id query param out of the URL.
      window.history.replaceState({}, document.title, window.location.pathname);
      updateProgress(); // Update progress bar after Cashfree return
    }
  }

  // --- Footer (no colors) ---
  const footer = document.getElementById("footer");
  if (footer)
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | Created by Kushal Mitra & AI`;

  updateProgress();
  handleCashfreeReturn();
});
