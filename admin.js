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
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const loader = document.getElementById("loader");
const dashboard = document.getElementById("dashboard");
const loginSection = document.getElementById("login-section");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("admin-email");
const passInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaisedEl = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const searchBox = document.getElementById("searchBox");
const sortSelect = document.getElementById("sortSelect");

let donationsData = [];

// Show Loader (2 sec max)
function showLoader() {
  loader.style.display = "flex";
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
    }, 600);
  }, 2000);
}

// Fetch Donations
async function loadDonations() {
  try {
    const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
    donationsData = snapshot.docs.map((doc) => doc.data());
    renderTable(donationsData);
  } catch (error) {
    console.error("Error loading donations:", error);
  }
}

function renderTable(data) {
  donationsTable.innerHTML = "";
  let total = 0;
  data.forEach((item) => {
    total += Number(item.amount) || 0;
    const date =
      item.date ||
      new Date(item.timestamp?.seconds * 1000).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.name || "-"}</td>
      <td>${item.email || "-"}</td>
      <td>₹${item.amount || 0}</td>
      <td>${item.txnID || item.txnId || "N/A"}</td>
      <td>${date}</td>
    `;
    donationsTable.appendChild(row);
  });

  totalRaisedEl.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / 20000) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// Filter, Sort & Search
searchBox.addEventListener("input", () => {
  const term = searchBox.value.toLowerCase();
  const filtered = donationsData.filter(
    (d) =>
      d.name?.toLowerCase().includes(term) ||
      d.email?.toLowerCase().includes(term) ||
      d.txnID?.toLowerCase().includes(term)
  );
  renderTable(filtered);
});

sortSelect.addEventListener("change", () => {
  let sorted = [...donationsData];
  if (sortSelect.value === "low") {
    sorted.sort((a, b) => a.amount - b.amount);
  } else if (sortSelect.value === "high") {
    sorted.sort((a, b) => b.amount - a.amount);
  }
  renderTable(sorted);
});

// Auth
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    showLoader();
    loadDonations();
  } else {
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  }
});

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) {
    loginError.textContent = "Please enter both fields.";
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginError.textContent = "Access Denied! Invalid credentials.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  loginSection.style.display = "block";
  dashboard.style.display = "none";
});

document.getElementById("footer").innerHTML = 
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | Created by Kushal Mitra & AI`;