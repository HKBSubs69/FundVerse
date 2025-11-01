// ✅ Initialize Firebase (v8)
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const goalAmount = 20000;
const upiID = "7079441779@ikwik";

const form = document.getElementById("donationForm");
const progressBar = document.getElementById("progress-bar");
const raisedAmount = document.getElementById("raised-amount");
const upiDisplay = document.getElementById("upi-display");
const upiText = document.getElementById("upi-text");
const qrCanvas = document.getElementById("upi-qr");

// ✅ Update progress bar and raised amount
async function updateProgress() {
  try {
    const snapshot = await db.collection("ComicProjectDonations").get();
    let total = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      total += Number(data.amount) || 0;
    });
    const percent = Math.min((total / goalAmount) * 100, 100);
    progressBar.style.width = `${percent}%`;
    raisedAmount.textContent = `Raised: ₹${total} / ₹${goalAmount}`;
  } catch (error) {
    console.error("Error updating progress:", error);
  }
}

// ✅ Show payment options
document.getElementById("payment-option").addEventListener("change", (e) => {
  const option = e.target.value;
  const amount = document.getElementById("amount").value.trim();

  if (!amount || amount <= 0) {
    alert("Please enter a valid amount first!");
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
    QRCode.toCanvas(qrCanvas, qrData, { width: 200 });
  }
});

// ✅ Submit donation form
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const txnId = document.getElementById("txnId").value.trim();

  if (!name || !email || !amount || !txnId) {
    alert("Please fill all fields!");
    return;
  }

  const now = new Date();
  const formattedDate = now.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  try {
    await db.collection("ComicProjectDonations").add({
      name,
      email,
      amount,
      txnId,
      date: formattedDate,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    alert("🎉 Thank you for your contribution!");
    form.reset();
    upiDisplay.classList.add("hidden");
    updateProgress();
  } catch (error) {
    console.error("Error adding donation:", error);
  }
});

// ✅ Auto-year footer
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

updateProgress();