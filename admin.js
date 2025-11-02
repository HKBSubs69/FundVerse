// === Firebase Config ===
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

// === DOM ===
var loginSection = document.getElementById("login-section");
var dashboard = document.getElementById("dashboard");
var loginBtn = document.getElementById("login-btn");
var logoutBtn = document.getElementById("logout-btn");
var emailInput = document.getElementById("admin-email");
var passInput = document.getElementById("admin-password");
var errorBox = document.getElementById("login-error");
var donationsTable = document.getElementById("donations-table");
var totalRaised = document.getElementById("total-raised");
var progressBar = document.getElementById("progress-bar");

var GOAL_AMOUNT = 20000;

// === Check if email is admin ===
function isAdmin(email) {
  return db.collection("AdminUsers")
    .where("email", "==", email.toLowerCase())
    .get()
    .then(snap => !snap.empty);
}

// === Login ===
loginBtn.addEventListener("click", function () {
  var email = emailInput.value.trim().toLowerCase();
  var password = passInput.value.trim();
  errorBox.textContent = "";

  auth.signInWithEmailAndPassword(email, password)
    .then(async cred => {
      var user = cred.user;
      var valid = await isAdmin(user.email);
      if (!valid) {
        auth.signOut();
        throw new Error("Access Denied: Not Authorized as Admin");
      }
      showDashboard();
    })
    .catch(err => {
      errorBox.textContent = err.message;
    });
});

// === Keep session active ===
auth.onAuthStateChanged(async function (user) {
  if (user) {
    var valid = await isAdmin(user.email);
    if (valid) showDashboard();
    else window.location.href = "index.html";
  }
});

// === Logout ===
logoutBtn.addEventListener("click", function () {
  auth.signOut().then(() => {
    dashboard.classList.add("hidden");
    loginSection.style.display = "block";
  });
});

// === Show Dashboard ===
function showDashboard() {
  loginSection.style.display = "none";
  dashboard.classList.remove("hidden");
  loadDonations();
}

// === Load Donations ===
function loadDonations() {
  db.collection("ComicProjectDonations").get()
    .then(snapshot => {
      donationsTable.innerHTML = "";
      var total = 0;

      snapshot.forEach(doc => {
        var d = doc.data();
        total += Number(d.amount) || 0;
        var txn = d.txnID || d.txnId || "N/A";
        var date = d.date || "N/A";

        var row = document.createElement("tr");
        row.innerHTML = `
          <td>${d.name}</td>
          <td>${d.email}</td>
          <td>₹${d.amount}</td>
          <td>${txn}</td>
          <td>${date}</td>
        `;
        donationsTable.appendChild(row);
      });

      totalRaised.textContent = "₹" + total.toLocaleString("en-IN");
      var percent = Math.min((total / GOAL_AMOUNT) * 100, 100);
      progressBar.style.width = percent + "%";
    })
    .catch(err => console.error("Error loading donations:", err));
}

// === Footer ===
document.getElementById("footer").innerHTML =
  "© FundVerse " + new Date().getFullYear() +
  " | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI";