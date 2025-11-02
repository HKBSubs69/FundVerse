import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loader = document.getElementById("loader");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");

// Loader Handling
function showLoader() {
  loader.style.display = "flex";
  dashboard.style.display = "none";
}
function hideLoader() {
  loader.style.display = "none";
  dashboard.style.display = "block";
}

// Auto Footer
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();
  const errorText = document.getElementById("login-error");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    errorText.textContent = "Invalid credentials. Try again.";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Auth State Persistence
onAuthStateChanged(auth, async (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    showLoader();
    await loadDonations();
    setTimeout(hideLoader, 1000);
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

// Load Donations
async function loadDonations() {
  donationsTable.innerHTML = "";
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;

  const donations = [];
  snapshot.forEach((doc) => {
    const data = doc.data();
    donations.push(data);
    total += Number(data.amount) || 0;
  });

  // Apply filters/sorting
  renderDonations(donations);
  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  progressBar.style.width = `${Math.min((total / 20000) * 100, 100)}%`;
}

// Render Donations
function renderDonations(donations) {
  donationsTable.innerHTML = "";

  // Sort
  const sortValue = document.getElementById("sort-select").value;
  if (sortValue === "asc") donations.sort((a, b) => a.amount - b.amount);
  else if (sortValue === "desc") donations.sort((a, b) => b.amount - a.amount);

  // Filter by date
  const startDate = document.getElementById("filter-start").value;
  const endDate = document.getElementById("filter-end").value;
  let filtered = donations;

  if (startDate && endDate) {
    filtered = donations.filter((d) => {
      const donationDate = new Date(d.date);
      return donationDate >= new Date(startDate) && donationDate <= new Date(endDate);
    });
  }

  // Search
  const query = document.getElementById("search-box").value.toLowerCase();
  if (query) {
    filtered = filtered.filter((d) =>
      d.name.toLowerCase().includes(query) ||
      d.email.toLowerCase().includes(query) ||
      d.txnId.toLowerCase().includes(query)
    );
  }

  // Display
  filtered.forEach((d) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>${d.email}</td>
      <td>₹${d.amount.toLocaleString("en-IN")}</td>
      <td>${d.txnId || "—"}</td>
      <td>${d.date || "—"}</td>
    `;
    donationsTable.appendChild(tr);
  });
}

// Event Listeners for filter/sort/search
document.getElementById("sort-select").addEventListener("change", loadDonations);
document.getElementById("filter-btn").addEventListener("click", loadDonations);
document.getElementById("search-box").addEventListener("input", loadDonations);