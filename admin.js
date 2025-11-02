// --- Firebase Config ---
var firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};
firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

// --- DOM Elements ---
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const GOAL = 20000;

// --- Check if email is in AdminUsers collection ---
async function isAdmin(email) {
  const snap = await db.collection("AdminUsers").where("email", "==", email).get();
  return !snap.empty;
}

// --- Show Dashboard ---
function showDashboard() {
  loginSection.style.display = "none";
  dashboard.style.display = "block";
  loadDonations();
}

// --- Login Logic ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();
  errorMsg.textContent = "";

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    const ok = await isAdmin(email);
    if (!ok) throw new Error("Access denied – not an authorized admin");
    showDashboard();
  } catch (err) {
    errorMsg.textContent = err.message;
  }
});

// --- Keep Logged In (Persistent Session) ---
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const ok = await isAdmin(user.email);
    if (ok) showDashboard();
  }
});

// --- Logout ---
logoutBtn.addEventListener("click", () => {
  auth.signOut().then(() => {
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  });
});

// --- Load Donations ---
function loadDonations() {
  db.collection("ComicProjectDonations").orderBy("timestamp", "desc").get()
    .then(snapshot => {
      donationsTable.innerHTML = "";
      let total = 0;

      snapshot.forEach(doc => {
        const d = doc.data();
        total += Number(d.amount) || 0;

        // Format date/time
        let formattedDate = "N/A";
        if (d.date) {
          formattedDate = d.date;
        } else if (d.timestamp && d.timestamp.seconds) {
          const dateObj = new Date(d.timestamp.seconds * 1000);
          formattedDate = dateObj.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata"
          }) + " (IST)";
        }

        const txn = d.txnID || d.txnId || "N/A";

        const row = `
          <tr>
            <td>${d.name || "-"}</td>
            <td>${d.email || "-"}</td>
            <td>₹${d.amount || 0}</td>
            <td>${txn}</td>
            <td>${formattedDate}</td>
          </tr>
        `;
        donationsTable.insertAdjacentHTML("beforeend", row);
      });

      // Update summary
      totalRaised.textContent = "₹" + total.toLocaleString("en-IN");
      progressBar.style.width = Math.min((total / GOAL) * 100, 100) + "%";
    })
    .catch(err => console.error("Error loading donations:", err));
}

// --- Footer Year ---
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;