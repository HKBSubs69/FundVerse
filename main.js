// main.js (final, uses Firebase v12 modular SDK)
// Ensure this file is included with: <script src="main.js" type="module"></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// ---------- FIREBASE CONFIG ----------
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

// ---------- CONSTANTS ----------
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// ---------- TYPING MESSAGE (single string) ----------
const typingMessage = "Connecting donors with dreams... ✨ Every contribution brings The Deserted Path to life.";

// ---------- Typing effect helper ----------
function startTyping(el, text, speed = 60) {
  if (!el) return;
  el.textContent = "";
  let i = 0;
  const caret = document.createElement("span");
  caret.style.borderRight = "3px solid #ff7676";
  caret.style.paddingLeft = "6px";
  caret.style.marginLeft = "6px";
  caret.style.display = "inline-block";
  el.appendChild(caret);

  function type() {
    if (i <= text.length) {
      el.childNodes[0] && el.childNodes[0].remove(); // remove old text node if any
      el.insertBefore(document.createTextNode(text.slice(0, i)), caret);
      i++;
      setTimeout(type, speed);
    } else {
      // keep caret blinking
      let visible = true;
      setInterval(() => {
        caret.style.borderColor = visible ? "transparent" : "#ff7676";
        visible = !visible;
      }, 600);
    }
  }
  type();
}

// ---------- DOM READY ----------
document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const loader = document.getElementById("loader");
  const loadingTextEl = document.getElementById("loading-text");
  const mainContent = document.getElementById("main-content");
  const form = document.getElementById("donationForm");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");
  const paymentOption = document.getElementById("payment-option");
  const footer = document.getElementById("footer");

  // Defensive checks
  if (!loader || !mainContent) {
    console.error("Critical elements missing: loader or main-content");
    return;
  }

  // Start typing while loader is shown
  startTyping(loadingTextEl, typingMessage, 50);

  // Show loader for ~1800ms then hide and initialize
  setTimeout(async () => {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
      mainContent.classList.remove("hidden");
    }, 450);
    // init after loader removed
    await updateProgress();
  }, 1800);

  // ---------- Update Progress ----------
  async function updateProgress() {
    try {
      const snap = await getDocs(collection(db, "ComicProjectDonations"));
      let total = 0;
      snap.forEach((d) => {
        const dd = d.data();
        total += Number(dd.amount) || 0;
      });
      const percent = Math.min((total / goalAmount) * 100, 100);
      if (progressBar) progressBar.style.width = `${percent}%`;
      if (raisedAmount) raisedAmount.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (err) {
      console.error("updateProgress failed:", err);
    }
  }

  // ---------- Payment option logic ----------
  if (paymentOption) {
    paymentOption.addEventListener("change", (ev) => {
      const opt = ev.target.value;
      const amountVal = (document.getElementById("amount") || {}).value;
      const amount = parseFloat(amountVal || 0);
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        ev.target.value = "";
        return;
      }
      if (upiDisplay) upiDisplay.classList.remove("hidden");

      if (opt === "upi-id") {
        if (upiText) {
          upiText.textContent = upiID + " (tap to open UPI)";
          upiText.onclick = () => {
            const url = `upi://pay?pa=${encodeURIComponent(upiID)}&pn=${encodeURIComponent("FundVerse")}&am=${encodeURIComponent(amount)}&cu=INR`;
            window.location.href = url;
          };
        }
        if (qrCanvas) qrCanvas.style.display = "none";
      } else if (opt === "upi-qr") {
        if (upiText) upiText.textContent = "";
        if (qrCanvas) {
          qrCanvas.style.display = "block";
          const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
          try {
            QRCode.toCanvas(qrCanvas, qrData, { width: 220 });
          } catch (err) {
            console.error("QR generation error:", err);
          }
        }
      }
    });
  }

  // ---------- Form submit ----------
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

      // Format date: 01 Nov 2025, 05:20 PM (IST)
      const now = new Date();
      const options = {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      };
      let formatted = now.toLocaleString("en-IN", options);
      // Ensure uppercase AM/PM and add (IST)
      formatted = formatted.replace("am", "AM").replace("pm", "PM") + " (IST)";

      try {
        await addDoc(collection(db, "ComicProjectDonations"), {
          name,
          email,
          amount,
          txnID: txn,             // using txnID field name as requested
          date: formatted,
          timestamp: serverTimestamp()
        });

        alert("🎉 Thank you for your contribution!");
        form.reset();
        if (upiDisplay) upiDisplay.classList.add("hidden");
        await updateProgress();
      } catch (err) {
        console.error("Failed to add donation:", err);
        alert("Something went wrong while saving. Check console.");
      }
    });
  }

  // ---------- Footer ----------
  if (footer) {
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;
  }
});