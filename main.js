// main.js - Stable final version (no emojis, mobile-safe, guaranteed loader finish)

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

/* ---------------- LOADING TEXTS ---------------- */
const messages = [
  "Making dreams possible, one donation at a time...",
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels imagination.",
  "Small acts of kindness build big dreams. Thank you for believing."
];

/* ---------------- Typing effect ---------------- */
function typeText(el, text, speed = 35) {
  return new Promise((resolve) => {
    if (!el) return resolve();
    el.textContent = "";
    let i = 0;
    const timer = setInterval(() => {
      el.textContent = text.substring(0, i);
      i++;
      if (i > text.length) {
        clearInterval(timer);
        resolve();
      }
    }, speed);
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

  const message = messages[Math.floor(Math.random() * messages.length)];

  // Typing effect with 5s fallback
  await Promise.race([
    typeText(loadingText, message, 35),
    new Promise((res) => setTimeout(res, 5000)),
  ]);

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

  // Hide loader after short delay
  setTimeout(() => {
    loader.style.display = "none";
    mainContent.classList.remove("hidden");
  }, 500);

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