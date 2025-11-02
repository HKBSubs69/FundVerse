// Firebase v8 syntax – works on all static hosts
var firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const progressBar = document.getElementById("progress-bar");
const totalRaisedEl = document.getElementById("total-raised");
const footer = document.getElementById("footer");

const goalAmount = 20000;

// Format date/time in IST
function formatIST(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  });
}

// Load donations
async function loadDonations() {
  const snapshot = await db.collection("ComicProjectDonations").get();
  donationsTable.innerHTML = "";
  let total = 0;

  snapshot.forEach((doc) => {
    const data = doc.data();
    total += Number(data.amount) || 0;
    const dateDisplay = data.date || (data.timestamp ? formatIST(data.timestamp.toDate()) : "-");

    donationsTable.innerHTML += `
      <tr>
        <td>${data.name || "—"}</td>
        <td>${data.email || "—"}</td>
        <td>₹${data.amount || 0}</td>
        <td>${data.txnId || "—"}</td>
        <td>${dateDisplay}</td>
      </tr>`;
  });

  totalRaisedEl.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / goalAmount) * 100, 100);
  progressBar.style.width = percent + "%";
}

// Login / Logout / Auth state
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  try {
    await auth.signInWithEmailAndPassword(email, password);
    loginError.textContent = "";
  } catch (err) {
    loginError.textContent = "Invalid credentials. Try again.";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

auth.onAuthStateChanged((user) => {
  if (user) {
    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadDonations();
  } else {
    dashboard.classList.add("hidden");
    loginSection.classList.remove("hidden");
  }
});

// Footer auto-year
footer.innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;