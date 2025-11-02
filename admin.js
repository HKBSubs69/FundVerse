// --- Firebase v12 Modular SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DOM Elements ---
const loader = document.getElementById("loader");
const main = document.getElementById("main-content");
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("admin-email");
const passInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const footer = document.getElementById("footer");

// --- Loader Fade Out ---
window.addEventListener("load", () => {
  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 1s ease";
    setTimeout(() => {
      loader.style.display = "none";
      main.classList.remove("hidden");
    }, 1000);
  }, 1500);
});

// --- Auth Persistence ---
setPersistence(auth, browserLocalPersistence);

// --- Auth State Change ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  }
});

// --- Login Function ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) {
    loginError.textContent = "Please enter both email and password.";
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    loginError.textContent = "Invalid credentials.";
    console.error(error);
  }
});

// --- Logout Function ---
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Load Donations from Firestore ---
async function loadDonations() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;
  donationsTable.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    total += Number(data.amount) || 0;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.email}</td>
      <td>₹${data.amount}</td>
      <td>${data.txnId}</td>
      <td>${data.date}</td>`;
    donationsTable.appendChild(row);
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / 20000) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// --- Footer Auto-Year ---
if (footer)
  footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | Created by Kushal Mitra & AI`;