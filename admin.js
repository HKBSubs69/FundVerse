// ---------------------------
// FundVerse Admin Dashboard
// Secure Auto-Login + txnID Fix
// ---------------------------

// Firebase imports (v9+ modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// ---------------------------
// Firebase Configuration
// ---------------------------
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
const auth = getAuth(app);

// ---------------------------
// Elements
// ---------------------------
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const totalRaisedText = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const donationsTable = document.getElementById("donations-table");
const footer = document.getElementById("footer");

// Goal amount
const goalAmount = 20000;

// ---------------------------
// Helper: Format date in IST
// ---------------------------
function formatTimestampToIST(timestamp) {
  if (!timestamp) return "—";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });
}

// ---------------------------
// Fetch Donations
// ---------------------------
async function fetchDonations() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  donationsTable.innerHTML = "";

  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    const name = data.name || "—";
    const email = data.email || "—";
    const amount = data.amount || 0;
    const txnID = data.txnID || "—";
    const timestamp = data.timestamp;

    total += Number(amount);

    const row = `
      <tr>
        <td>${name}</td>
        <td>${email}</td>
        <td>₹${amount}</td>
        <td>${txnID}</td>
        <td>${formatTimestampToIST(timestamp)}</td>
      </tr>
    `;
    donationsTable.insertAdjacentHTML("beforeend", row);
  });

  totalRaisedText.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / goalAmount) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// ---------------------------
// Auto Footer Year
// ---------------------------
footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// ---------------------------
// Authentication System
// ---------------------------

// Keep user signed in during session (auto-login on refresh)
setPersistence(auth, browserSessionPersistence);

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    fetchDonations();
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

// Login event
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  if (!email || !password) {
    loginError.textContent = "Please enter both email and password.";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    console.error("Login failed:", error.message);
    loginError.textContent = "Invalid credentials or permission denied.";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  loginSection.style.display = "block";
  dashboard.style.display = "none";
});
