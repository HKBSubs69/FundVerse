import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loginCard = document.getElementById("login-card");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const sortSelect = document.getElementById("sort-amount");
const filterSelect = document.getElementById("filter-date");

let donationsData = [];

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadDonations();
  } else {
    loginCard.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch {
    alert("Access denied. Invalid credentials.");
  }
});

// Logout
logoutBtn.addEventListener("click", async () => await signOut(auth));

// Load Donations
async function loadDonations() {
  const donationsTable = document.getElementById("donations-table");
  const totalRaised = document.getElementById("total-raised");
  const progressBar = document.getElementById("progress-bar");
  const goal = 20000;

  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;
  donationsData = [];

  snapshot.forEach((doc) => {
    const d = doc.data();
    const amount = Number(d.amount) || 0;
    total += amount;

    const formattedDate = d.date
      ? d.date.replace("am", "AM").replace("pm", "PM")
      : "—";

    donationsData.push({
      name: d.name || "—",
      email: d.email || "—",
      amount,
      txnID: d.txnID || "N/A",
      date: formattedDate
    });
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  progressBar.style.width = `${(total / goal) * 100}%`;

  renderTable();
}

// Render Donations Table
function renderTable() {
  const table = document.getElementById("donations-table");
  table.innerHTML = "";

  let data = [...donationsData];

  // Sort by Amount
  if (sortSelect.value === "high") data.sort((a, b) => b.amount - a.amount);
  else if (sortSelect.value === "low") data.sort((a, b) => a.amount - b.amount);

  // Filter by Date
  if (filterSelect.value === "newest") data.reverse();
  else if (filterSelect.value === "oldest") data = data;

  data.forEach((d) => {
    table.innerHTML += `
      <tr>
        <td>${d.name}</td>
        <td>${d.email}</td>
        <td>₹${d.amount}</td>
        <td>${d.txnID}</td>
        <td>${d.date}</td>
      </tr>`;
  });
}

// Listen to sort & filter
sortSelect.addEventListener("change", renderTable);
filterSelect.addEventListener("change", renderTable);