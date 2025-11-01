// ---------- FUNDVERSE MAIN SCRIPT ----------

// Firebase Configuration
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

// Global constants
const UPI_ID = "7079441779@ikwik";
const UPI_BASE = "upi://pay?pa=7079441779@ikwik&pn=Blue%20Ocean%20Studios%20India&cu=INR&am=";

// Elements
const amountEl = document.getElementById("amount");
const upiIDBtn = document.getElementById("upi-id-btn");
const upiQRBtn = document.getElementById("upi-qr-btn");
const upiDisplay = document.getElementById("upi-display");
const qrDisplay = document.getElementById("qr-display");
const footerText = document.getElementById("footer-text");
const donationForm = document.getElementById("donation-form");

// ---------- FOOTER YEAR ----------
const year = new Date().getFullYear();
footerText.innerHTML =
  `© FundVerse ${year} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// ---------- SHOW UPI ID ----------
upiIDBtn.addEventListener("click", function () {
  const amt = amountEl.value;
  if (!amt || amt <= 0) {
    alert("Please enter a valid amount first!");
    return;
  }
  const payLink = UPI_BASE + amt;
  upiDisplay.classList.remove("hidden");
  qrDisplay.classList.add("hidden");
  upiDisplay.innerHTML = `
    <p><strong>UPI ID:</strong> 
      <a href="${payLink}" target="_blank" style="color:red">${UPI_ID}</a>
    </p>
    <p>Click above to pay via your preferred UPI app.</p>`;
});

// ---------- SHOW DYNAMIC QR ----------
upiQRBtn.addEventListener("click", function () {
  const amt = amountEl.value;
  if (!amt || amt <= 0) {
    alert("Please enter a valid amount first!");
    return;
  }
  const payLink = UPI_BASE + amt;
  qrDisplay.classList.remove("hidden");
  upiDisplay.classList.add("hidden");
  qrDisplay.innerHTML = `
    <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(payLink)}&size=220x220" 
         alt="UPI QR Code">
    <p>Scan to pay ₹${amt}</p>`;
});

// ---------- SUBMIT DONATION ----------
donationForm.addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = Number(amountEl.value);
  const txnId = document.getElementById("txnId").value.trim();

  if (!name || !email || !amount || !txnId) {
    alert("All fields are required!");
    return;
  }

  try {
    await db.collection("ComicProjectDonations").add({
      name: name,
      email: email,
      amount: amount,
      txnID: txnId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("🎉 Thank you for your contribution!");
    donationForm.reset();
    upiDisplay.classList.add("hidden");
    qrDisplay.classList.add("hidden");
  } catch (error) {
    console.error(error);
    alert("⚠️ Error submitting donation. Please try again later.");
  }
});

// ---------- UPDATE PROGRESS BAR ----------
db.collection("ComicProjectDonations").onSnapshot((snapshot) => {
  let total = 0;
  snapshot.forEach((doc) => {
    total += Number(doc.data().amount || 0);
  });
  const percent = Math.min((total / 20000) * 100, 100);
  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").textContent =
    `Raised: ₹${total} / ₹20,000`;
});