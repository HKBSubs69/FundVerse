import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const goal = 20000;

const donateBtn = document.getElementById("donateBtn");
const popup = document.getElementById("popup");
const closePopup = document.getElementById("closePopup");
const upiIdBtn = document.getElementById("upiIdBtn");
const upiQrBtn = document.getElementById("upiQrBtn");
const upiInfo = document.getElementById("upiInfo");
const qrInfo = document.getElementById("qrInfo");
const qrImage = document.getElementById("qrImage");
const copyUpi = document.getElementById("copyUpi");
const amountInput = document.getElementById("amount");
const txnId = document.getElementById("transactionId");
const submitDonation = document.getElementById("submitDonation");
const raisedAmount = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");
const footerText = document.getElementById("footerText");

footerText.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

donateBtn.onclick = () => popup.classList.remove("hidden");
closePopup.onclick = () => popup.classList.add("hidden");

upiIdBtn.onclick = () => {
  upiInfo.classList.remove("hidden");
  qrInfo.classList.add("hidden");
};

upiQrBtn.onclick = () => {
  const upiID = "7079441779@ikwik";
  const amount = amountInput.value || 0;
  const qrData = `upi://pay?pa=${upiID}&am=${amount}&cu=INR`;
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  qrInfo.classList.remove("hidden");
  upiInfo.classList.add("hidden");
};

copyUpi.onclick = () => {
  navigator.clipboard.writeText("7079441779@ikwik");
  alert("UPI ID copied to clipboard!");
};

submitDonation.onclick = async () => {
  const amount = amountInput.value;
  const transactionId = txnId.value;
  if (!amount || !transactionId) {
    alert("Please enter amount and transaction ID.");
    return;
  }

  await addDoc(collection(db, "ComicProjectDonations"), {
    name: "Anonymous",
    email: "anonymous@fundverse.com",
    amount,
    transactionId,
    time: new Date().toLocaleString()
  });

  alert("🎉 Thank you for your support!");
  popup.classList.add("hidden");
  amountInput.value = "";
  txnId.value = "";
};

onSnapshot(collection(db, "ComicProjectDonations"), (snapshot) => {
  let total = 0;
  snapshot.forEach((doc) => (total += Number(doc.data().amount || 0)));
  raisedAmount.textContent = `₹${total.toLocaleString()} raised of ₹20,000 goal`;
  progressBar.style.width = Math.min((total / goal) * 100, 100) + "%";
});