// ===============================
// FundVerse Admin Panel Script
// ===============================

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elements
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("admin-email");
const passInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaisedEl = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const footer = document.getElementById("footer");

// Goal Amount
const goalAmount = 20000;

// ===============================
// Helper Functions
// ===============================

// Format date as "01 Nov 2025, 05:34 PM (IST)"
function formatDate(isoString) {
  try {
    const date = new Date(isoString);
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    };
    return new Intl.DateTimeFormat("en-GB", options)
      .format(date)
      .replace(",", "") + " (IST)";
  } catch {
    return "Invalid Date";
  }
}

// Fetch Donations from Firestore
async function fetchDonations() {
  try {
    const snapshot = await db.collection("ComicProjectDonations").get();
    let total = 0;
    let rows = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      total += parseInt(data.amount || 0);

      const txn = data.txnId || "N/A";
      const dateStr = data.timestamp ? formatDate(data.timestamp) : "Invalid Date";

      rows += `
        <tr>
          <td>${data.name || "Unknown"}</td>
          <td>${data.email || "—"}</td>
          <td>₹${data.amount || 0}</td>
          <td>${txn}</td>
          <td>${dateStr}</td>
        </tr>
      `;
    });

    donationsTable.innerHTML = rows;
    totalRaisedEl.textContent = `₹${total}`;

    const percent = Math.min((total / goalAmount) * 100, 100);
    progressBar.style.width = `${percent}%`;
  } catch (error) {
    console.error("Error fetching donations:", error);
  }
}

// ===============================
// Authentication (Simple Email/Password)
// ===============================

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();

  if (!email || !password) {
    loginError.textContent = "Please enter both email and password.";
    return;
  }

  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    fetchDonations();
  } catch (error) {
    loginError.textContent = "Invalid credentials or no access.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await firebase.auth().signOut();
  dashboard.style.display = "none";
  loginSection.style.display = "block";
  emailInput.value = "";
  passInput.value = "";
});

// ===============================
// Footer Auto Year
// ===============================
footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;