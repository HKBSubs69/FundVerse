// --- Firebase Configuration ---
var firebaseConfig = {
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

const adminEmail = "kushalmitra2008@gmail.com"; // ✅ only this email allowed

// --- DOM Elements ---
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("login-error");
const totalRaisedEl = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const donationsTable = document.getElementById("donations-table");

// --- Auth State Persistence ---
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("✅ Persistence: LOCAL"))
  .catch((e) => console.error("Persistence error:", e));

// --- Auth State Listener ---
auth.onAuthStateChanged((user) => {
  if (user && user.email === adminEmail) {
    console.log("✅ Admin logged in:", user.email);
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    console.log("❌ No admin user or unauthorized email.");
    auth.signOut();
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  }
});

// --- Login Function ---
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    if (result.user.email === adminEmail) {
      loginSection.style.display = "none";
      dashboard.style.display = "block";
      loadDonations();
    } else {
      errorMsg.textContent = "Access denied: Not an authorized admin.";
      await auth.signOut();
    }
  } catch (error) {
    console.error(error);
    errorMsg.textContent = "Login failed: " + error.message;
  }
});

// --- Logout Function ---
logoutBtn.addEventListener("click", () => {
  auth.signOut();
  dashboard.style.display = "none";
  loginSection.style.display = "block";
});

// --- Load Donations ---
async function loadDonations() {
  try {
    const snapshot = await db.collection("ComicProjectDonations").orderBy("timestamp", "desc").get();
    let total = 0;
    donationsTable.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      total += Number(data.amount) || 0;

      const date = data.date || (data.timestamp?.toDate ? 
        data.timestamp.toDate().toLocaleString("en-IN", { 
          day: "2-digit", month: "short", year: "numeric", 
          hour: "2-digit", minute: "2-digit", hour12: true 
        }) : "N/A");

      const row = `
        <tr style="border-bottom:1px solid #222;">
          <td style="padding:8px;">${data.name || "-"}</td>
          <td style="padding:8px;">${data.email || "-"}</td>
          <td style="padding:8px;">₹${data.amount || 0}</td>
          <td style="padding:8px;">${data.txnId || "N/A"}</td>
          <td style="padding:8px;">${date}</td>
        </tr>`;
      donationsTable.innerHTML += row;
    });

    totalRaisedEl.textContent = "₹" + total.toLocaleString("en-IN");
    const goal = 20000;
    progressBar.style.width = Math.min((total / goal) * 100, 100) + "%";

  } catch (error) {
    console.error("Error loading donations:", error);
  }
}

// --- Footer ---
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;