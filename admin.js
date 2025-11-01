// -----------------------------
// FundVerse Admin Panel Script (FINAL FIXED VERSION)
// -----------------------------

const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Elements
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const emailField = document.getElementById("admin-email");
const passField = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaisedDisplay = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");

// Login
loginBtn.addEventListener("click", async () => {
  const email = emailField.value.trim();
  const password = passField.value.trim();
  if (!email || !password) {
    errorMsg.textContent = "Please enter both email and password.";
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, password);
    errorMsg.textContent = "";
  } catch (err) {
    errorMsg.textContent = "❌ " + err.message;
  }
});

auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

// Helper function for Indian Time
function formatIST(timestamp) {
  if (!timestamp || !timestamp.seconds) return "—";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    day: "2-digit",
    month: "short",
    year: "numeric"
  }) + " (IST)";
}

// Fetch donations
function loadDonations() {
  db.collection("ComicProjectDonations")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      let total = 0;
      donationsTable.innerHTML = "";

      snapshot.forEach(doc => {
        const d = doc.data();
        const txn = d.txnId || "—";
        const time = formatIST(d.timestamp);
        total += Number(d.amount) || 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.name || "—"}</td>
          <td>${d.email || "—"}</td>
          <td>₹${d.amount || 0}</td>
          <td>${txn}</td>
          <td>${time}</td>
        `;
        donationsTable.appendChild(tr);
      });

      totalRaisedDisplay.textContent = `₹${total.toLocaleString()}`;
      const goal = 20000;
      const percent = Math.min((total / goal) * 100, 100);
      progressBar.style.width = percent + "%";
    });
}
