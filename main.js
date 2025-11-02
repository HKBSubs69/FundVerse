// main.js - Final stable with multi-line typing and universal emojis

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

/* ---------------- LOADING LINES ---------------- */
const messages = [
  "✨ Empowering creativity — your support brings stories to life.",
  "❤️ Every contribution counts. Help dreams turn into reality.",
  "🚀 Join the journey — because every hero needs a supporter.",
  "✅ Together, we create more than art — we create hope."
];

/* ---------------- Typing effect ---------------- */
function typeText(el, texts, speed = 35) {
  return new Promise((resolve) => {
    if (!el) return resolve();
    let textIndex = 0;
    let charIndex = 0;

    function type() {
      if (textIndex >= texts.length) return resolve();

      const text = texts[textIndex];
      el.textContent = text.substring(0, charIndex);
      charIndex++;

      if (charIndex > text.length) {
        textIndex++;
        charIndex = 0;
        setTimeout(type, 800); // small pause between lines
      } else {
        setTimeout(type, speed);
      }
    }
    type();
  });
}

/* ---------------- MAIN SCRIPT ---------------- */
document.addEventListener("DOMContentLoaded", async () => {
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  const loadingText = document.getElementById("loading-text");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const form = document.getElementById("donationForm");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");
  const paymentOption = document.getElementById("payment-option");
  const footer = document.getElementById("footer");

  // Pick 2 random lines
  const shuffled = messages.sort(() => 0.5 - Math.random()).slice(0, 2);

  // Typing animation with fallback timeout (max 6.5s)
  await Promise.race([
    typeText(loadingText, shuffled, 35),
    new Promise((res) => setTimeout(res, 6500)),
  ]);

  /* ---------------- Update Progress ---------------- */
  async function updateProgress() {
    try {
      const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += Number(data.amount) || 0;
      });
      const percent = Math.min((total / goalAmount) * 100, 100);
      progressBar.style.width = `${percent}%`;
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (error) {
      console.error("Progress update failed:", error);
    }
  }

  await updateProgress();

  // Show page after typing or timeout
  setTimeout(() => {
    loader.style.display = "none";
    mainContent.classList.remove("hidden");
  }, 6500);

  /* ---------------- PAYMENT OPTIONS ---------------- */
  if (paymentOption) {
    paymentOption.addEventListener("change", (e) => {
      const option = e.target.value;
      const amount = parseFloat(document.getElementById("amount").value || 0);
      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        e.target.value = "";
        return;
      }

      upiDisplay.classList.remove("hidden");

      if (option === "upi-id") {
        upiText.textContent = `${upiID} (tap to pay)`;
        qrCanvas.style.display = "none";
        upiText.onclick = () => {
          const url = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
          window.location.href = url;
        };
      } else if (option === "upi-qr") {
        upiText.textContent = "";
        qrCanvas.style.display = "block";
        const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
        QRCode.toCanvas(qrCanvas, qrData, { width: 220 });
      }
    });
  }

  /* ---------------- FORM SUBMIT ---------------- */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const amount = parseFloat(document.getElementById("amount").value);
      const txnId = document.getElementById("txnId").value.trim();

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
      }).replace("am", "AM").replace("pm", "PM") + " (IST)";

      try {
        await addDoc(collection(db, "ComicProjectDonations"), {
          name,
          email,
          amount,
          txnID: txnId,
          date: formattedDate,
          timestamp: serverTimestamp(),
        });
        alert("Thank you for your contribution!");
        form.reset();
        upiDisplay.classList.add("hidden");
        await updateProgress();
      } catch (error) {
        console.error("Error adding donation:", error);
        alert("Something went wrong. Try again!");
      }
    });
  }

  /* ---------------- FOOTER ---------------- */
  footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;
});