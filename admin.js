// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// --- DOM Elements ---
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("admin-email");
const passInput = document.getElementById("admin-password");
const errorBox = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");

// --- Constants ---
const GOAL_AMOUNT = 20000;

// --- Admin Check Function ---
async function isAdmin(email) {
  const snapshot = await db.collection("AdminUsers").where("email", "==", email).get();
  return !snapshot.empty;
}

// --- Login ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  errorBox.textContent = "";

  try {
    const userCred = await auth.signInWithEmailAndPassword(email, password);
    const user = userCred.user;

    const validAdmin = await isAdmin(user.email);
    if (!validAdmin) {
      await auth.signOut();
      throw new Error("Access denied: Not authorized as admin");
    }

    showDashboard();
  } catch (err) {
    errorBox.textContent = err.message;
  }
});

// --- Stay Logged In ---
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const validAdmin = await isAdmin(user.email);
    if (validAdmin) showDashboard();
  }
});

// --- Logout ---
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  dashboard.classList.add("hidden");
  loginSection.style.display = "block";
});

// --- Show Dashboard ---
async function showDashboard() {
  loginSection.style.display = "none";
  dashboard.classList.remove("hidden");
  loadDonations();
}

// --- Load Donations ---
async function loadDonations() {
  const snapshot = await db.collection("ComicProjectDonations").get();
  donationsTable.innerHTML = "";

  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    total += Number(data.amount) || 0;

    const row = document.createElement("tr");
    const date = data.date || "N/A";
    const txnID = data.txnId || data.txnID || "N/A";

    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.email}</td>
      <td>₹${data.amount}</td>
      <td>${txnID}</td>
      <td>${date}</td>
    `;
    donationsTable.appendChild(row);
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / GOAL_AMOUNT) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// --- Footer ---
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;