// ---------------------------
// FundVerse Main Script (Final Version)
// ---------------------------

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const donationForm = document.getElementById("donation-form");
const raisedAmountText = document.getElementById("raised-amount");
const progressFill = document.getElementById("progress-fill");
const paymentOption = document.getElementById("payment-option");
const qrContainer = document.getElementById("qr-container");

// Constants
const GOAL_AMOUNT = 20000;
const UPI_ID = "7079441779@ikwik";

// ---------------------------
// Payment Option Logic
// ---------------------------
paymentOption.addEventListener("change", () => {
  const selected = paymentOption.value;
  const amount = document.getElementById("amount").value.trim();

  if (!amount) {
    qrContainer.innerHTML = `<p style="color:#ff4d4d;">Please enter an amount first.</p>`;
    return;
  }

  if (selected === "upiQR") {
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=Blue%20Ocean%20Studios%20India&am=${amount}&cu=INR`;
    const qrAPI = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
    qrContainer.innerHTML = `
      <img src="${qrAPI}" alt="UPI QR Code" style="margin-top:10px;border-radius:10px;width:200px;height:200px;">
      <p style="color:#bbb;margin-top:5px;">Scan this QR to pay ₹${amount}</p>
    `;
  } else if (selected === "upiID") {
    qrContainer.innerHTML = `
      <p style="color:#ff4d4d;margin-top:8px;">Send ₹${amount} to: <strong>${UPI_ID}</strong></p>
      <button id="open-upi" style="margin-top:8px;background:#ff2e2e;color:#fff;padding:8px 16px;border:none;border-radius:8px;">Pay via UPI App</button>
    `;
    document.getElementById("open-upi").addEventListener("click", () => {
      const link = `upi://pay?pa=${UPI_ID}&pn=Blue%20Ocean%20Studios%20India&am=${amount}&cu=INR`;
      window.location.href = link;
    });
  } else {
    qrContainer.innerHTML = "";
  }
});

// ---------------------------
// Submit Donation
// ---------------------------
donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value.trim());
  const txnID = document.getElementById("txn-id").value.trim();

  if (!name || !email || !amount || !txnID) {
    alert("⚠️ Please fill all fields, including Transaction ID.");
    return;
  }

  const data = {
    name,
    email,
    amount,
    txnID,
    timestamp: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
  };

  try {
    await db.collection("ComicProjectDonations").add(data);
    alert("🎉 Thank you for your contribution!");
    donationForm.reset();
    qrContainer.innerHTML = "";
    updateProgress();
  } catch (error) {
    console.error("Error saving donation:", error);
  }
});

// ---------------------------
// Progress Bar Updater
// ---------------------------
async function updateProgress() {
  let total = 0;
  const snapshot = await db.collection("ComicProjectDonations").get();
  snapshot.forEach(doc => total += parseFloat(doc.data().amount) || 0);

  const percentage = Math.min((total / GOAL_AMOUNT) * 100, 100).toFixed(1);
  progressFill.style.width = `${percentage}%`;
  raisedAmountText.textContent = `Raised: ₹${total} / ₹${GOAL_AMOUNT}`;
}

updateProgress();
setInterval(updateProgress, 5000);

// ---------------------------
// Auto Year in Footer
// ---------------------------
document.getElementById("autoYear").textContent = new Date().getFullYear();
