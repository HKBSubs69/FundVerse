// FundVerse main.js
// Connects with Firebase, updates total raised, and manages form + payment options

// Firebase config (automatically loaded from your environment or Firebase init file)
const firebaseConfig = {
  apiKey: "AIzaSyCw6vmrE7F1-sZmfY4_LFHDyEEcvZp4TQE",
  authDomain: "fundverse-app.firebaseapp.com",
  projectId: "fundverse-app",
  storageBucket: "fundverse-app.appspot.com",
  messagingSenderId: "1072202828884",
  appId: "1:1072202828884:web:12828d1f96ed6bdf4eec82"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --------------------
// 🧾 Update Total Raised & Progress Bar
// --------------------
const totalGoal = 20000; // target goal
const progressBar = document.querySelector(".progress-bar-fill");
const raisedAmountText = document.getElementById("raised-amount");

db.collection("ComicProjectDonations").onSnapshot(snapshot => {
  let total = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    total += Number(data.amount) || 0;
  });

  const progressPercent = Math.min((total / totalGoal) * 100, 100);
  progressBar.style.width = `${progressPercent}%`;
  raisedAmountText.textContent = `Raised: ₹${total.toLocaleString()} / ₹${totalGoal.toLocaleString()}`;
});

// --------------------
// 💰 Handle Payment Options
// --------------------
const paymentSelect = document.getElementById("payment-option");
const amountInput = document.getElementById("amount");
const qrPopup = document.getElementById("qr-popup");
const qrImage = document.getElementById("qr-image");
const upiIdDisplay = document.getElementById("upi-id-display");
const closePopup = document.getElementById("close-popup");

const UPI_ID = "7079441779@ikwik";

paymentSelect.addEventListener("change", () => {
  const selected = paymentSelect.value;
  const amount = amountInput.value.trim();

  if (!amount) {
    alert("Please enter an amount first!");
    paymentSelect.value = "";
    return;
  }

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=FundVerse&am=${amount}&cu=INR`;

  if (selected === "UPI ID") {
    window.location.href = upiLink; // redirects to UPI apps
  } else if (selected === "UPI QR") {
    // Generate dynamic QR
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}`;
    qrPopup.style.display = "flex";
  }
});

closePopup.addEventListener("click", () => {
  qrPopup.style.display = "none";
});

// --------------------
// 📤 Handle Form Submission
// --------------------
const donationForm = document.getElementById("donation-form");

donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const txnId = document.getElementById("txn-id").value.trim();
  const timestamp = new Date();

  if (!name || !email || !amount || !txnId) {
    alert("Please fill in all required fields!");
    return;
  }

  try {
    await db.collection("ComicProjectDonations").add({
      name,
      email,
      amount,
      txnId,
      timestamp
    });

    alert("✅ Thank you for contributing to the project!");
    donationForm.reset();
  } catch (error) {
    console.error("Error submitting donation:", error);
    alert("❌ Something went wrong. Please try again.");
  }
});

// --------------------
// 📅 Auto Year in Footer
// --------------------
document.getElementById("year").textContent = new Date().getFullYear();
