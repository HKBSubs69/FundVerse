// main.js (module) - Robust, defensive, uses txnID, waits for QR lib if needed

// --- Firebase v12 Modular SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- Firebase Config (keep as-is) ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

// --- Init Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Constants ---
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// --- Loader lines (no emojis) ---
const lines = [
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels a dream.",
  "Together, we make imagination real.",
  "Fueling art, passion, and purpose — one donation at a time.",
];

// Helper: wait for a global variable (used to wait for QR lib)
function waitForGlobal(name, timeout = 3000) {
  return new Promise((resolve, reject) => {
    if (window[name]) return resolve(window[name]);
    const start = Date.now();
    const iv = setInterval(() => {
      if (window[name]) {
        clearInterval(iv);
        return resolve(window[name]);
      }
      if (Date.now() - start > timeout) {
        clearInterval(iv);
        return reject(new Error(`${name} not available`));
      }
    }, 100);
  });
}

// --- Show Loading (types ONE random sentence, then shows main) ---
function showLoadingOnce() {
  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loading-text");
  const main = document.getElementById("main-content");
  if (!loader || !textEl || !main) {
    console.warn("Loader or main elements missing — skipping loader.");
    if (main) main.classList.remove("hidden");
    return;
  }

  // Clear text & ensure visible
  textEl.textContent = "";
  loader.style.display = "flex";
  loader.style.opacity = "1";

  const line = lines[Math.floor(Math.random() * lines.length)];
  let i = 0;
  const typingDelay = 45; // balanced speed (ms per char)

  function typeChar() {
    if (i < line.length) {
      textEl.textContent += line.charAt(i);
      i++;
      setTimeout(typeChar, typingDelay);
    } else {
      // finished typing -> wait a moment then fade loader
      setTimeout(() => {
        loader.style.transition = "opacity 0.7s ease";
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
          main.classList.remove("hidden");
          main.style.opacity = "1";
          main.style.transition = "opacity 0.5s ease";
        }, 700);
      }, 900);
    }
  }

  typeChar();
}

// --- DOMContentLoaded: main logic ---
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // show loader then reveal content
    showLoadingOnce();

    // Grab elements (defensive checks)
    const form = document.getElementById("donationForm");
    const progressBar = document.getElementById("progress-bar");
    const raisedAmount = document.getElementById("raised-amount");
    const upiDisplay = document.getElementById("upi-display");
    const upiText = document.getElementById("upi-text");
    const qrCanvas = document.getElementById("upi-qr");

    // make sure upiDisplay exists; if not, create a safe fallback
    if (!upiDisplay || !upiText || !qrCanvas) {
      console.warn("UPI display elements missing — payment UI disabled.");
    }

    // --- Update progress function ---
    async function updateProgress() {
      if (!progressBar || !raisedAmount) {
        console.warn("Progress elements missing; skipping updateProgress.");
        return;
      }
      try {
        const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
        let total = 0;
        snapshot.forEach((d) => {
          const data = d.data();
          // Accept both 'amount' and string numbers
          const a = Number(data.amount || data.amountIn || 0);
          total += isNaN(a) ? 0 : a;
        });

        const percent = Math.min((total / goalAmount) * 100, 100);
        progressBar.style.width = `${percent}%`;
        raisedAmount.textContent = `Raised: ₹${total.toLocaleString(
          "en-IN"
        )} / ₹${goalAmount.toLocaleString("en-IN")}`;
      } catch (err) {
        console.error("updateProgress error:", err);
      }
    }

    // Initial progress update
    await updateProgress();

    // --- Payment option handling ---
    const paymentOption = document.getElementById("payment-option");
    if (paymentOption && upiDisplay && upiText && qrCanvas) {
      paymentOption.addEventListener("change", async (e) => {
        const option = e.target.value;
        const amountStr = document.getElementById("amount")?.value || "";
        const amount = amountStr.trim();
        if (!amount || Number(amount) <= 0) {
          alert("Please enter a valid amount first.");
          e.target.value = "";
          return;
        }

        // show area
        upiDisplay.classList.remove("hidden");

        if (option === "upi-id") {
          // show a styled clickable UPI ID
          upiText.innerHTML = `<span class="upi-glow" title="Tap to open UPI apps">${upiID}</span>`;
          qrCanvas.style.display = "none";
          upiText.onclick = () => {
            const url = `upi://pay?pa=${encodeURIComponent(
              upiID
            )}&pn=${encodeURIComponent("FundVerse")}&am=${encodeURIComponent(
              amount
            )}&cu=INR`;
            window.location.href = url;
          };
        } else if (option === "upi-qr") {
          upiText.innerHTML = "";
          qrCanvas.style.display = "block";

          // ensure QR lib is ready
          try {
            await waitForGlobal("QRCode", 3000);
            const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
            // clear canvas before rendering
            try {
              const ctx = qrCanvas.getContext && qrCanvas.getContext("2d");
              if (ctx) ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
            } catch (e) {}
            QRCode.toCanvas(qrCanvas, qrData, { width: 220 }, function (err) {
              if (err) console.error("QRCode draw error:", err);
            });
          } catch (err) {
            console.warn("QRCode library not loaded:", err);
            qrCanvas.style.display = "none";
            upiText.textContent = `${upiID}`; // fallback
          }
        } else {
          // none selected
          upiDisplay.classList.add("hidden");
        }
      });
    } else {
      // missing UI elements; ignore payment option events safely
      if (!paymentOption) console.warn("payment-option element not found.");
    }

    // --- Form submit: store txnID (exact field name) ---
    if (form) {
      form.addEventListener("submit", async (evt) => {
        evt.preventDefault();

        const name = document.getElementById("name")?.value.trim() || "";
        const email = document.getElementById("email")?.value.trim() || "";
        const amountVal = document.getElementById("amount")?.value || "";
        const amount = parseFloat(amountVal);
        const txnId = document.getElementById("txnId")?.value.trim() || "";

        if (!name || !email || !amount || !txnId) {
          alert("Please fill all fields!");
          return;
        }

        const now = new Date();
        const formattedDate = now.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata",
        });

        try {
          await addDoc(collection(db, "ComicProjectDonations"), {
            name,
            email,
            amount,
            txnID: txnId, // EXACT field name requested
            date: formattedDate,
            timestamp: serverTimestamp(),
          });

          alert("🎉 Thank you for your contribution!");
          form.reset();
          if (upiDisplay) upiDisplay.classList.add("hidden");
          await updateProgress();
        } catch (err) {
          console.error("Error saving donation:", err);
          alert("Something went wrong. Try again.");
        }
      });
    } else {
      console.warn("donationForm element not found — donations disabled.");
    }

    // --- Footer text (email blue) ---
    const footer = document.getElementById("footer");
    if (footer) {
      footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by <span style="color:#00bfff">Blue Ocean Studios India</span> | Made in India | Created by <span style="color:#00bfff">Kushal Mitra</span> & AI`;
    }
  } catch (fatalErr) {
    console.error("Fatal error in main.js:", fatalErr);
  }
});