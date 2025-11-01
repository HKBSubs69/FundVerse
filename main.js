// ---- Firebase imports ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// ---- Your real config ----
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// ---- Initialize ----
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const donationsRef = collection(db, "ComicProjectDonations");

// ---- Elements ----
const form = document.getElementById("donationForm");
const upiDisplay = document.getElementById("upiDisplay");
const qrDisplay = document.getElementById("qrDisplay");
const paymentOption = document.getElementById("paymentOption");
const raisedText = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Constants ----
const upiID = "7079441779@ikwik";
const goal = 20000;

// ============================================================
// 🔴 1.  Live Firestore listener for Raised + Progress
// ============================================================
onSnapshot(donationsRef, (snapshot) => {
  let total = 0;
  snapshot.forEach((d) => (total += Number(d.data().amount || 0)));

  const pct = Math.min((total / goal) * 100, 100);
  progressBar.style.width = pct + "%";
  raisedText.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goal.toLocaleString("en-IN")}`;
});

// ============================================================
// 🔴 2.  Show payment option (must enter amount first)
// ============================================================
paymentOption.addEventListener("change", () => {
  const amount = parseFloat(document.getElementById("amount").value);
  upiDisplay.classList.add("hidden");
  qrDisplay.classList.add("hidden");

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount before choosing a payment method.");
    paymentOption.value = "";
    return;
  }

  const link = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;

  if (paymentOption.value === "upi_id") {
    upiDisplay.classList.remove("hidden");
    upiDisplay.innerHTML = `
      <p><strong>UPI ID:</strong> ${upiID}</p>
      <button class="btn-red" onclick="window.location.href='${link}'">
        Pay ₹${amount} via UPI App
      </button>`;
  }

  if (paymentOption.value === "upi_qr") {
    qrDisplay.classList.remove("hidden");
    qrDisplay.innerHTML = `
      <p>Scan to pay ₹${amount}</p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}&size=220x220"
           alt="UPI QR" style="display:block;margin:10px auto;border-radius:8px;">`;
  }
});

// ============================================================
// 🔴 3.  Handle form submit
// ============================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const txnID = document.getElementById("txnID").value.trim();

  if (!name || !email || !amount || !txnID) {
    alert("Please complete all fields and payment before submitting.");
    return;
  }

  try {
    await addDoc(donationsRef, {
      name,
      email,
      amount,
      txnID,
      timestamp: new Date().toISOString()
    });

    alert("🎉 Thank you for your contribution!");
    form.reset();
    upiDisplay.classList.add("hidden");
    qrDisplay.classList.add("hidden");
    paymentOption.value = "";
  } catch (err) {
    console.error(err);
    alert("Error saving donation. Try again later.");
  }
});