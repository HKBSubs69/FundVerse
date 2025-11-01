// ---- Firebase Setup ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// ---- Auto Year in Footer ----
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Payment Option Dropdown ----
document.getElementById("paymentOption").addEventListener("change", function () {
  const upiDisplay = document.getElementById("upiDisplay");
  const qrDisplay = document.getElementById("qrDisplay");
  const selected = this.value;
  const amount = document.getElementById("amount").value;

  upiDisplay.classList.add("hidden");
  qrDisplay.classList.add("hidden");

  if (selected === "upi_id") {
    upiDisplay.classList.remove("hidden");
    upiDisplay.innerHTML = `
      <p style="color:#fff;text-align:center;margin-top:10px">
        <b>Send payment to:</b> 7079441779@ikwik
      </p>
      <button class="btn-red" style="margin-top:10px"
        onclick="window.location.href='upi://pay?pa=7079441779@ikwik&am=${amount}&cu=INR'">
        Pay via UPI App
      </button>
    `;
  } else if (selected === "upi_qr") {
    qrDisplay.classList.remove("hidden");
    qrDisplay.innerHTML = `
      <p style="color:#fff;text-align:center;margin-top:10px">
        Scan the QR below to pay ₹${amount || "..."}
      </p>
      <img src="https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=7079441779@ikwik&am=${amount}&cu=INR&size=200x200"
        alt="UPI QR Code" style="display:block;margin:10px auto;border-radius:8px;">
    `;
  }
});

// ---- Form Submit ----
const donationForm = document.getElementById("donationForm");
donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const txnID = document.getElementById("txnID").value.trim();

  if (!txnID || !amount) {
    alert("Please complete all fields and payment details.");
    return;
  }

  try {
    await addDoc(collection(db, "donations"), {
      name,
      email,
      amount,
      txnID,
      timestamp: new Date().toISOString(),
    });

    alert("🎉 Thank you for your contribution!");
    donationForm.reset();
    document.getElementById("upiDisplay").classList.add("hidden");
    document.getElementById("qrDisplay").classList.add("hidden");
  } catch (error) {
    console.error("Error saving donation:", error);
    alert("Error submitting donation. Please try again.");
  }
});

// ---- Real-Time Raised Amount ----
onSnapshot(collection(db, "donations"), (snapshot) => {
  let total = 0;
  snapshot.forEach((doc) => {
    total += Number(doc.data().amount || 0);
  });

  const raisedElement = document.getElementById("raisedAmount");
  raisedElement.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹20,000`;

  const percent = Math.min((total / 20000) * 100, 100);
  document.getElementById("progressBar").style.width = percent + "%";
});