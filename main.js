// main.js - final typing+loader fix + Firestore (v12 modular)
// Replace entire file content with this code.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

/* ---------------- FIREBASE CONFIG ---------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------------- CONSTANTS ---------------- */
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

/* ---------------- MESSAGES ---------------- */
const messages = [
  "💫 Making dreams possible, one donation at a time...",
  "🎨 Empowering creativity — your support brings art to life!",
  "🚀 Join the mission — every contribution fuels a new story!",
  "❤️ Small acts of support build big dreams. Thank you!"
];

/* ---------------- typingEffect helper ----------------
   Returns a Promise that resolves when typing completes.
   Accepts element, text, speed (ms per char).
*/
function typingEffectPromise(el, text, speed = 45) {
  return new Promise((resolve) => {
    if (!el) {
      resolve(); // nothing to type into
      return;
    }

    el.textContent = ""; // clear
    // caret span (visual)
    let caret = document.createElement("span");
    caret.style.borderRight = "3px solid #ff7676";
    caret.style.display = "inline-block";
    caret.style.width = "6px";
    caret.style.marginLeft = "6px";
    el.appendChild(caret);

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        // insert text before caret
        const txtNode = document.createTextNode(text[i]);
        el.insertBefore(txtNode, caret);
        i++;
      } else {
        clearInterval(timer);
        // blink caret forever
        let visible = true;
        setInterval(() => {
          caret.style.borderColor = visible ? "transparent" : "#ff7676";
          visible = !visible;
        }, 600);
        resolve();
      }
    }, speed);
  });
}

/* ---------------- DOM READY ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  const loadingText = document.getElementById("loading-text");

  // safe element refs
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const form = document.getElementById("donationForm");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");
  const paymentOption = document.getElementById("payment-option");
  const footer = document.getElementById("footer");

  // If critical elements are missing, proceed so page doesn't lock.
  // Pick message
  const msg = messages[Math.floor(Math.random() * messages.length)];

  // Kick off typing, but ensure we never hang: use Promise.race with fallback timeout
  const typingPromise = typingEffectPromise(loadingText, msg, 45);
  const fallbackTimeoutMs = 6000; // 6 seconds max typing wait
  const typingDone = await Promise.race([
    typingPromise,
    new Promise((res) => setTimeout(res, fallbackTimeoutMs)),
  ]);

  // Now update progress and show main content
  async function updateProgress() {
    if (!progressBar || !raisedAmount) return;
    try {
      const snap = await getDocs(collection(db, "ComicProjectDonations"));
      let total = 0;
      snap.forEach((d) => {
        const data = d.data();
        total += Number(data.amount) || 0;
      });
      const percent = Math.min((total / goalAmount) * 100, 100);
      progressBar.style.width = `${percent}%`;
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (err) {
      console.error("updateProgress error:", err);
    }
  }

  // After typing finishes (or fallback), call updateProgress then reveal page.
  try {
    await updateProgress();
  } catch (err) {
    console.error("progress update failed before reveal:", err);
  }

  // Reveal content (use small delay for smoothness)
  setTimeout(() => {
    if (loader) loader.style.display = "none";
    if (mainContent) mainContent.classList.remove("hidden");
  }, 300);

  /* ---------------- Payment option handling ---------------- */
  if (paymentOption) {
    paymentOption.addEventListener("change", (e) => {
      const option = e.target.value;
      const amountVal = (document.getElementById("amount") || {}).value;
      const amount = parseFloat(amountVal || 0);
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        e.target.value = "";
        return;
      }
      if (upiDisplay) upiDisplay.classList.remove("hidden");

      if (option === "upi-id") {
        if (upiText) upiText.textContent = upiID + " (tap to pay)";
        if (qrCanvas) qrCanvas.style.display = "none";
        if (upiText) upiText.onclick = () => {
          const url = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent("FundVerse")}&am=${encodeURIComponent(amount)}&cu=INR`;
          window.location.href = url;
        };
      } else if (option === "upi-qr") {
        if (upiText) upiText.textContent = "";
        if (qrCanvas) {
          qrCanvas.style.display = "block";
          const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
          try {
            QRCode.toCanvas(qrCanvas, qrData, { width: 220 });
          } catch (err) {
            console.error("QRCode error:", err);
          }
        }
      }
    });
  }

  /* ---------------- Form submit ----------------
     Stores txnID (exact field name) and formatted date
  */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = (document.getElementById("name") || {}).value.trim();
      const email = (document.getElementById("email") || {}).value.trim();
      const amount = parseFloat((document.getElementById("amount") || {}).value || 0);
      const txn = (document.getElementById("txnId") || {}).value.trim();

      if (!name || !email || !amount || !txn) {
        alert("Please fill all fields!");
        return;
      }

      const now = new Date();
      const options = {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      };
      let formatted = now.toLocaleString("en-IN", options);
      // Ensure AM/PM uppercase
      formatted = formatted.replace("am", "AM").replace("pm", "PM") + " (IST)";

      try {
        await addDoc(collection(db, "ComicProjectDonations"), {
          name,
          email,
          amount,
          txnID: txn,     // store as txnID so admin can read it
          date: formatted,
          timestamp: serverTimestamp()
        });
        alert("🎉 Thank you for your contribution!");
        form.reset();
        if (upiDisplay) upiDisplay.classList.add("hidden");
        // update progress after new donation
        await updateProgress();
      } catch (err) {
        console.error("submit error:", err);
        alert("Something went wrong while saving donation. Check console.");
      }
    });
  }

  /* ---------------- Footer auto-year ---------------- */
  if (footer) {
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;
  }

}); // end DOMContentLoaded