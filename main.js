import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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

const form = document.getElementById("donationForm");
const amountInput = document.getElementById("amount");
const paymentOption = document.getElementById("paymentOption");
const upiDetails = document.getElementById("upiDetails");
const upiText = document.getElementById("upiText");
const qrCanvas = document.getElementById("qrCanvas");
const raisedAmount = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");

document.getElementById("year").textContent = new Date().getFullYear();

paymentOption.addEventListener("change", async () => {
  const amount = amountInput.value || 0;
  const upiId = "fundverse@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=FundVerse&am=${amount}&cu=INR`;

  if (paymentOption.value === "upiID") {
    upiDetails.classList.remove("hidden");
    qrCanvas.classList.add("hidden");
    upiText.innerHTML = `Click below to pay using UPI ID:<br><a href="${upiLink}" style="color:#ff2e2e;">${upiId}</a>`;
  } else if (paymentOption.value === "upiQR") {
    upiDetails.classList.remove("hidden");
    upiText.textContent = "Scan this QR to Pay:";
    qrCanvas.classList.remove("hidden");

    const qr = await import("https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js");
    qr.default.toCanvas(qrCanvas, upiLink);
  } else {
    upiDetails.classList.add("hidden");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const amount = parseFloat(amountInput.value);
  const txnId = form.txnId.value.trim();
  const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  await addDoc(collection(db, "ComicProjectDonations"), {
    name,
    email,
    amount,
    txnID: txnId,
    timestamp
  });

  alert("Thank you for contributing!");
  form.reset();
  fetchRaisedAmount();
});

async function fetchRaisedAmount() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;
  snapshot.forEach(doc => {
    total += parseFloat(doc.data().amount) || 0;
  });
  raisedAmount.textContent = `Raised: ₹${total} / ₹20,000`;
  progressBar.value = total;
}
fetchRaisedAmount();
