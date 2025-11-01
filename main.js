// Firebase Config (Use your existing correct setup)
const firebaseConfig = {
  apiKey: "AIzaSyDXQ-6Ebbm9mH2JvZzG1D3Ysh1h6otM8ko",
  authDomain: "fundverse.firebaseapp.com",
  projectId: "fundverse",
  storageBucket: "fundverse.appspot.com",
  messagingSenderId: "794229998763",
  appId: "1:794229998763:web:db2e99cb5e83a1f84e93b7"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// DOM Elements
const form = document.getElementById("donationForm");
const paymentOption = document.getElementById("paymentOption");
const upiSection = document.getElementById("upiSection");
const progressFill = document.getElementById("progressFill");
const raisedText = document.getElementById("raisedText");
const year = document.getElementById("year");

// Auto year
year.textContent = new Date().getFullYear();

// Show UPI Section
paymentOption.addEventListener("change", () => {
  upiSection.style.display = paymentOption.value === "upi" ? "block" : "none";
});

// Load total raised and update progress
async function updateProgress() {
  const snapshot = await db.collection("ComicProjectDonations").get();
  let total = 0;
  snapshot.forEach(doc => total += Number(doc.data().amount || 0));

  const goal = 20000;
  const percent = Math.min((total / goal) * 100, 100);
  progressFill.style.width = percent + "%";
  raisedText.textContent = `Raised: ₹${total} / ₹${goal}`;
}
updateProgress();

// Handle form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const amount = form.amount.value.trim();
  const txnId = form.txnId.value.trim();
  const captchaResponse = grecaptcha.getResponse();

  if (!captchaResponse) {
    alert("Please complete the reCAPTCHA");
    return;
  }

  await db.collection("ComicProjectDonations").add({
    name,
    email,
    amount,
    txnId,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  alert("🎉 Thank you for your support!");
  form.reset();
  grecaptcha.reset();
  upiSection.style.display = "none";
  updateProgress();
});
