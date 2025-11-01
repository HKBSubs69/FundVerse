// ---------------------------
// FundVerse Admin Dashboard
// ---------------------------

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
const auth = firebase.auth();

const logoutBtn = document.getElementById("logout-btn");
const donationTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const goalBar = document.getElementById("goal-bar");

const GOAL_AMOUNT = 20000;

// ---------------------------
// Fetch & Display Donations
// ---------------------------
async function loadDonations() {
  donationTable.innerHTML = "";
  let total = 0;

  const snapshot = await db.collection("ComicProjectDonations").get();
  snapshot.forEach((doc) => {
    const d = doc.data();
    total += parseFloat(d.amount) || 0;

    const row = document.createElement("tr");
    const timestamp = d.timestamp
      ? new Date(d.timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "Invalid Date";

    row.innerHTML = `
      <td>${d.name}</td>
      <td>${d.email}</td>
      <td>₹${d.amount}</td>
      <td>${d.txnID || "N/A"}</td>
      <td>${timestamp}</td>
    `;
    donationTable.appendChild(row);
  });

  const percent = Math.min((total / GOAL_AMOUNT) * 100, 100).toFixed(1);
  goalBar.style.width = `${percent}%`;
  totalRaised.textContent = `₹${total}`;
}

auth.onAuthStateChanged((user) => {
  if (user) loadDonations();
  else window.location.href = "login.html";
});

// ---------------------------
// Logout
// ---------------------------
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => (window.location.href = "login.html"));
});

// Auto Year
document.getElementById("autoYear").textContent = new Date().getFullYear();
