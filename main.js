// --- Firebase v12 Modular SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Constants ---
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// --- Loader Lines ---
const lines = [
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels a dream.",
  "Together, we make imagination real.",
  "Fueling art, passion, and purpose — one donation at a time.",
];

// --- Show Random Line Once ---
function showLoading() {
  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loading-text");
  const main = document.getElementById("main-content");

  const line = lines[Math.floor(Math.random() * lines.length)];
  textEl.textContent = "";
  let i = 0;

  function type() {
    if (i < line.length) {
      textEl.textContent += line.charAt(i);
      i++;
      setTimeout(type, 45);
    } else {
      setTimeout(() => {
        loader.style.transition = "opacity 0.8s ease";
        loader.style.opacity = "0";
        setTimeout(() => {
          loader.style.display = "none";
          main.classList.remove("hidden");
          main.style.opacity = "1";
          main.style.transition = "opacity 0.8s ease";
        }, 800);
      }, 900);
    }
  }

  type();
}

// --- Firestore Logic ---
document.addEventListener("DOMContentLoaded", () => {
  showLoading();

  const form = document.getElementById("donationForm");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");

  // --- Update progress ---
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
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString(
        "en-IN"
      )} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  }

  // --- Payment Options ---
  const paymentOption = document.getElementById("payment-option");
  if (paymentOption) {
    paymentOption.addEventListener("change", (e) => {
      const option = e.target.value;
      const amount = document.getElementById("amount").value.trim();

      if (!amount || amount <= 0) {
        alert("Please enter a valid amount first.");
        e.target.value = "";
        return;
      }

      upiDisplay.classList.remove("hidden");

      if (option === "upi-id") {
        upiText.innerHTML = `
          <span class="upi-glow" title="Tap to Pay">${upiID}</span>
        `;
        qrCanvas.classList.add("hidden");
        upiText.onclick = () => {
          const url = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
          window.location.href = url;
        };
      } else if (option === "upi-qr") {
        upiText.innerHTML = "";
        qrCanvas.classList.remove("hidden");
        const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
        QRCode.toCanvas(qrCanvas, qrData, { width: 220 });
      }
    });
  }

  // --- Form Submission ---
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
      });

      try {
        await addDoc(collection(db, "ComicProjectDonations"), {
          name,
          email,
          amount,
          txnID: txnId,
          date: formattedDate,
          timestamp: serverTimestamp(),
        });
        alert("🎉 Thank you for your contribution!");
        form.reset();
        upiDisplay.classList.add("hidden");
        updateProgress();
      } catch (error) {
        console.error("Error adding donation:", error);
        alert("Something went wrong. Try again!");
      }
    });
  }

  // --- Footer ---
  const footer = document.getElementById("footer");
  if (footer)
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by <span style="color:#00bfff;">Blue Ocean Studios India</span> | Made in India 🇮🇳 | Created by <span style="color:#00bfff;">Kushal Mitra</span> & AI`;

  updateProgress();
});