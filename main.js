// Import Firebase (v9 modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Firebase Config
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

// Constants
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// Elements
const form = document.getElementById("donationForm");
const progressBar = document.getElementById("progress-bar");
const raisedAmount = document.getElementById("raised-amount");
const upiDisplay = document.getElementById("upi-display");
const upiText = document.getElementById("upi-text");
const qrCanvas = document.getElementById("upi-qr");

// Update total amount + progress bar
async function updateProgress() {
  try {
    const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
    let total = 0;
    snapshot.forEach((doc) => (total += parseInt(doc.data().amount || 0)));
    const percent = Math.min((total / goalAmount) * 100, 100);
    progressBar.style.width = `${percent}%`;
    raisedAmount.innerText = `Raised: ₹${total} / ₹${goalAmount}`;
  } catch (err) {
    console.error("Progress Update Error:", err);
  }
}

// Payment option logic
document.getElementById("payment-option").addEventListener("change", async (e) => {
  const option = e.target.value;
  const amount = document.getElementById("amount").value.trim();

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount first.");
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
    const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
    QRCode.toCanvas(qrCanvas, qrData, { width: 200 }, (error) => {
      if (error) console.error(error);
    });
  }
});

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseInt(document.getElementById("amount").value);
  const txnId = document.getElementById("txnId").value.trim();

  if (!name || !email || !amount || !txnId) {
    alert("Please fill all fields!");
    return;
  }

  try {
    await addDoc(collection(db, "ComicProjectDonations"), {
      name,
      email,
      amount,
      txnId,
      timestamp: new Date()
    });

    // Optional EmailJS (if used)
    if (typeof emailjs !== "undefined") {
      emailjs.send("service_vepkrhs", "template_rco2ar3", {
        to_name: name,
        amount,
        reply_to: email
      }, "KijBVWP5PtYQoaPSF");
    }

    alert("🎉 Thank you for your contribution!");
    form.reset();
    upiDisplay.classList.add("hidden");
    await updateProgress();
  } catch (err) {
    console.error("Donation Submit Error:", err);
    alert("Something went wrong. Please try again.");
  }
});

// Auto Footer
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// Initialize progress
updateProgress();