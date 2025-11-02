import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
const goal = 20000;
const upiID = "7079441779@ikwik";

const loader = document.getElementById("loader");
const mainContent = document.getElementById("main-content");
const progressBar = document.getElementById("progress-bar");
const raisedAmount = document.getElementById("raised-amount");

async function updateProgress() {
  try {
    const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
    let total = 0;
    snapshot.forEach((doc) => total += Number(doc.data().amount) || 0);

    const percent = Math.min((total / goal) * 100, 100);
    progressBar.style.width = `${percent}%`;
    raisedAmount.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goal.toLocaleString("en-IN")}`;
  } finally {
    loader.classList.add("hidden");
    mainContent.classList.remove("hidden");
  }
}

document.getElementById("payment-option").addEventListener("change", (e) => {
  const option = e.target.value;
  const amount = document.getElementById("amount").value.trim();
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");

  if (!amount || amount <= 0) {
    alert("Enter a valid amount first!");
    e.target.value = "";
    return;
  }

  upiDisplay.classList.remove("hidden");

  if (option === "upi-id") {
    upiText.textContent = upiID;
    qrCanvas.classList.add("hidden");
    upiText.onclick = () => {
      const url = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
      window.location.href = url;
    };
  } else if (option === "upi-qr") {
    upiText.textContent = "";
    qrCanvas.classList.remove("hidden");
    QRCode.toCanvas(qrCanvas, `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`, { width: 200 });
  }
});

document.getElementById("donationForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const amount = parseFloat(amountInput.value);
  const txnId = txnInput.value.trim();
  if (!name || !email || !amount || !txnId) return alert("Fill all fields!");

  const now = new Date();
  const formattedDate = now.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
  });

  await addDoc(collection(db, "ComicProjectDonations"), {
    name, email, amount, txnID: txnId, date: formattedDate, timestamp: serverTimestamp()
  });

  alert("🎉 Thank you for your contribution!");
  e.target.reset();
  document.getElementById("upi-display").classList.add("hidden");
  updateProgress();
});

document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

updateProgress();