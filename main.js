// main.js — FundVerse Final Secure Version (with dynamic QR + live progress + reCAPTCHA)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// --- FIREBASE CONFIG ---
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

// --- DOM REFERENCES ---
const form = document.getElementById("donationForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const amountInput = document.getElementById("amount");
const txnInput = document.getElementById("txnId");
const paymentOption = document.getElementById("paymentOption");
const upiDetails = document.getElementById("upiDetails");
const raisedAmount = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");

// --- CONSTANTS ---
const GOAL = 20000;
const UPI_ID = "7079441779@ikwik";
const UPI_NAME = "FundVerse";

// --- DYNAMIC QR + ID DISPLAY ---
paymentOption.addEventListener("change", () => {
  const method = paymentOption.value;
  const amount = Number(amountInput.value || 0);
  if (!method) {
    upiDetails.innerHTML = "";
    return;
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${encodeURIComponent(amount)}&cu=INR`;

  if (method === "upiID") {
    upiDetails.innerHTML = `
      <p><strong>UPI ID:</strong> ${UPI_ID}</p>
      <p>Tap below to open your UPI app with the amount prefilled.</p>
      <button id="openUpiBtn" style="background:#ff2e2e;color:#fff;border:none;border-radius:10px;padding:10px 14px;margin-top:6px;cursor:pointer">Open UPI App</button>
      <p class="hint">After payment, enter your Transaction ID below.</p>
    `;
    document.getElementById("openUpiBtn").onclick = () => { window.location.href = upiLink; };
  }

  if (method === "upiQR") {
    const qrURL = `https://chart.googleapis.com/chart?cht=qr&chs=250x250&chl=${encodeURIComponent(upiLink)}`;
    upiDetails.innerHTML = `
      <p>Scan this QR to pay via any UPI app:</p>
      <img src="${qrURL}" alt="UPI QR" style="width:220px;height:220px;border-radius:12px;margin:8px auto;display:block;background:#fff;padding:6px">
      <p class="hint">After payment, check your app’s payment history and paste the Transaction ID below.</p>
    `;
  }
});

// --- reCAPTCHA ---
let recaptchaVerified = false;
window.onRecaptchaSuccess = function () {
  recaptchaVerified = true;
};

// --- FORM SUBMIT ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const amount = Number(amountInput.value);
  const txn = txnInput.value.trim();

  if (!name || !email || !amount || !txn) {
    alert("Please fill all fields and Transaction ID after payment.");
    return;
  }

  if (!recaptchaVerified) {
    alert("Please verify reCAPTCHA before submitting.");
    return;
  }

  try {
    await addDoc(collection(db, "ComicProjectDonations"), {
      name, email, amount, txnID: txn, timestamp: serverTimestamp()
    });
    alert("✅ Thank you! Your donation was recorded successfully.");
    form.reset();
    upiDetails.innerHTML = "";
    grecaptcha.reset();
    recaptchaVerified = false;
  } catch (err) {
    console.error("Error saving donation:", err);
    alert("Something went wrong. Try again later.");
  }
});

// --- LIVE PROGRESS BAR ---
onSnapshot(collection(db, "ComicProjectDonations"), (snapshot) => {
  let total = 0;
  snapshot.forEach(doc => total += Number(doc.data().amount) || 0);
  raisedAmount.textContent = `Raised: ₹${total.toLocaleString()} / ₹${GOAL.toLocaleString()}`;
  const progress = Math.min((total / GOAL) * 100, 100);
  progressBar.value = total;
  progressBar.max = GOAL;
});
