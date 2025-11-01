// 🔥 Firebase Configuration
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

// UPI and QR
const upiID = "7079441779@ikwik";
const qrBase = "upi://pay?pa=7079441779@ikwik&pn=Blue%20Ocean%20Studios%20India&cu=INR&am=";

// Elements
const amountInput = document.getElementById("amount");
const upiBtn = document.getElementById("upi-id-btn");
const qrBtn = document.getElementById("upi-qr-btn");
const upiDisplay = document.getElementById("upi-display");
const qrDisplay = document.getElementById("qr-display");
const footerText = document.getElementById("footer-text");
const donationForm = document.getElementById("donation-form");

// Footer auto year
const year = new Date().getFullYear();
footerText.innerHTML = `© FundVerse ${year} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// Show UPI ID
upiBtn.addEventListener("click", () => {
  const amount = amountInput.value;
  if (!amount || amount <= 0) return alert("Enter valid amount first!");
  const link = `${qrBase}${amount}`;
  upiDisplay.classList.remove("hidden");
  qrDisplay.classList.add("hidden");
  upiDisplay.innerHTML = `
    <p>UPI ID: <a href="${link}" target="_blank">${upiID}</a></p>
    <p>Click above to pay via your UPI app.</p>`;
});

// Show Dynamic QR
qrBtn.addEventListener("click", () => {
  const amount = amountInput.value;
  if (!amount || amount <= 0) return alert("Enter valid amount first!");
  const link = `${qrBase}${amount}`;
  upiDisplay.classList.add("hidden");
  qrDisplay.classList.remove("hidden");
  qrDisplay.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}&size=200x200" alt="UPI QR Code">`;
});

// Submit donation
donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const txnId = document.getElementById("txnId").value.trim();

  if (!name || !email || !amount || !txnId) return alert("All fields are required!");

  try {
    await db.collection("ComicProjectDonations").add({
      name,
      email,
      amount,
      txnID: txnId,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    alert("🎉 Thank you for your contribution!");
    donationForm.reset();
    upiDisplay.classList.add("hidden");
    qrDisplay.classList.add("hidden");
  } catch (err) {
    console.error(err);
    alert("Error submitting donation. Try again.");
  }
});

// Progress bar auto update
db.collection("ComicProjectDonations").onSnapshot(snapshot => {
  let total = 0;
  snapshot.forEach(doc => (total += Number(doc.data().amount || 0)));
  const percent = Math.min((total / 20000) * 100, 100);
  document.getElementById("progress-bar").style.width = percent + "%";
  document.getElementById("progress-text").textContent = `Raised: ₹${total} / ₹20,000`;
});