import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Firebase Config (Your same keys)
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

// Elements
const form = document.getElementById("donationForm");
const paymentOption = document.getElementById("paymentOption");
const paymentInfo = document.getElementById("paymentInfo");
const amountInput = document.getElementById("amount");
const progressBar = document.getElementById("progressBar");
const raisedText = document.getElementById("raisedText");
const footerText = document.getElementById("footerText");

const GOAL = 20000;
const upiID = "7079441779@ikwik";

// Auto Year Footer
const year = new Date().getFullYear();
footerText.innerHTML = `© FundVerse ${year} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// Payment Option
paymentOption.addEventListener("change", () => {
  const amount = parseFloat(amountInput.value);
  if (!amount || amount <= 0) {
    alert("Please enter an amount first!");
    paymentOption.value = "";
    return;
  }

  paymentInfo.innerHTML = "";

  if (paymentOption.value === "upiID") {
    const link = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
    paymentInfo.innerHTML = `
      <p>Click below to pay via your UPI app:</p>
      <a href="${link}" class="upi-link">Pay Now (UPI ID: ${upiID})</a>
    `;
  } else if (paymentOption.value === "upiQR") {
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?data=upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR&size=200x200`;
    paymentInfo.innerHTML = `
      <p>Scan this QR to pay ₹${amount}</p>
      <img src="${qrURL}" alt="UPI QR Code" class="upi-qr" />
    `;
  }
});

// Form Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const amount = parseFloat(form.amount.value);
  const txnID = form.txnID.value.trim();
  if (!name || !email || !amount || !txnID) return alert("Please fill all details!");

  const now = new Date();
  const formattedDate = now.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  try {
    await addDoc(collection(db, "ComicProjectDonations"), {
      name, email, amount, txnID, date: formattedDate
    });
    form.reset();
    paymentInfo.innerHTML = "";
    showPopup();
  } catch (err) {
    alert("Error saving donation.");
    console.error(err);
  }
});

// Live Update Raised Amount
onSnapshot(collection(db, "ComicProjectDonations"), (snapshot) => {
  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    total += Number(data.amount) || 0;
  });

  const progress = Math.min((total / GOAL) * 100, 100);
  progressBar.style.width = `${progress}%`;
  raisedText.textContent = `Raised: ₹${total.toLocaleString()} / ₹${GOAL.toLocaleString()}`;
});

// Popup
function showPopup() {
  const popup = document.getElementById("thankYouPopup");
  popup.classList.remove("hidden");
  setTimeout(() => popup.classList.add("hidden"), 3000);
}