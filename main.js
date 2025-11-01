// Import Firebase SDK modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// ✅ Firebase Config (keep hidden in .env for production)
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const donationForm = document.getElementById("donationForm");
const paymentOption = document.getElementById("paymentOption");
const upiDisplay = document.getElementById("upiDisplay");
const qrDisplay = document.getElementById("qrDisplay");
const raisedText = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");
const totalGoal = 20000;

// 🔴 UPI Details
const upiID = "7079441779@ikwik";

// Live year
document.getElementById("year").textContent = new Date().getFullYear();

// ✅ Real-Time Progress Fetch
const donationsRef = collection(db, "ComicProjectDonations");
onSnapshot(donationsRef, (snapshot) => {
  let totalRaised = 0;
  snapshot.forEach(doc => {
    const data = doc.data();
    totalRaised += parseFloat(data.amount || 0);
  });
  
  // Update progress bar and text
  const progress = Math.min((totalRaised / totalGoal) * 100, 100);
  progressBar.style.width = `${progress}%`;
  raisedText.innerText = `Raised: ₹${totalRaised.toFixed(2)} / ₹${totalGoal}`;
});

// ✅ Payment Option Handling (Require Amount First)
paymentOption.addEventListener("change", () => {
  const amountValue = parseFloat(document.getElementById("amount").value);
  upiDisplay.classList.add("hidden");
  qrDisplay.classList.add("hidden");

  if (!amountValue || amountValue <= 0) {
    alert("⚠️ Please enter a valid amount before selecting a payment method.");
    paymentOption.value = "";
    return;
  }

  const selected = paymentOption.value;
  if (selected === "upi_id") {
    upiDisplay.innerHTML = `<p>Click below to pay via UPI ID:</p>
      <button class="btn-red" id="upiLink">Pay ₹${amountValue}</button>`;
    upiDisplay.classList.remove("hidden");

    document.getElementById("upiLink").addEventListener("click", () => {
      const upiUrl = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amountValue}&cu=INR`;
      window.location.href = upiUrl;
    });

  } else if (selected === "upi_qr") {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=${upiID}&pn=FundVerse&am=${amountValue}&cu=INR&size=200x200`;
    qrDisplay.innerHTML = `<p>Scan this QR to pay ₹${amountValue}:</p>
      <img src="${qrUrl}" alt="UPI QR" class="qr-img">`;
    qrDisplay.classList.remove("hidden");
  }
});

// ✅ Form Submission
donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const txnID = document.getElementById("txnID").value.trim();

  if (!txnID) {
    alert("Please enter your Transaction ID after completing the payment!");
    return;
  }

  try {
    await addDoc(donationsRef, {
      name,
      email,
      amount,
      txnID,
      date: new Date().toISOString()
    });

    alert("✅ Thank you for your contribution!");
    donationForm.reset();
    upiDisplay.classList.add("hidden");
    qrDisplay.classList.add("hidden");

  } catch (error) {
    console.error("Error saving donation:", error);
    alert("❌ Error submitting donation. Try again.");
  }
});