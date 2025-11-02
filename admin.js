import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { 
  getFirestore, collection, getDocs 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

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

const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const progressBar = document.getElementById("progress-bar");
const totalRaisedEl = document.getElementById("total-raised");

const goalAmount = 20000;

// --- Format Date to IST ---
function formatIST(date) {
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

// --- Fetch Donations ---
async function loadDonations() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  donationsTable.innerHTML = "";

  let total = 0;
  snapshot.forEach((doc) => {
    const data = doc.data();
    total += Number(data.amount) || 0;

    const row = `
      <tr>
        <td>${data.name || "—"}</td>
        <td>${data.email || "—"}</td>
        <td>₹${data.amount || 0}</td>
        <td>${data.txnId || "—"}</td>
        <td>${data.date || formatIST(data.timestamp?.toDate?.() || new Date())}</td>
      </tr>`;
    donationsTable.innerHTML += row;
  });

  totalRaisedEl.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / goalAmount) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// --- Auth Handling ---
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (err) {
    loginError.textContent = "Invalid credentials. Try again.";
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// --- Auth State Observer ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadDonations();
  } else {
    dashboard.classList.add("hidden");
    loginSection.classList.remove("hidden");
  }
});

// --- Footer ---
document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;