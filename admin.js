// --- Firebase v12 Modular SDK ---
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
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- DOM Elements ---
const loader = document.getElementById("loader");
const main = document.getElementById("main-content");
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("admin-email");
const passInput = document.getElementById("admin-password");
const loginError = document.getElementById("login-error");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const footer = document.getElementById("footer");
const downloadBtn = document.getElementById("download-btn");

let donationRows = [];

// --- Loader Fade Out ---
window.addEventListener("load", () => {
  setTimeout(() => {
    loader.style.opacity = "0";
    loader.style.transition = "opacity 1s ease";
    setTimeout(() => {
      loader.style.display = "none";
      main.classList.remove("hidden");
    }, 1000);
  }, 1500);
});

// --- Auth Persistence ---
setPersistence(auth, browserLocalPersistence);

// --- Auth State Change ---
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  }
});

// --- Login Function ---
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passInput.value.trim();
  if (!email || !password) {
    loginError.textContent = "Please enter both email and password.";
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    loginError.textContent = "Invalid credentials.";
    console.error(error);
  }
});

// --- Logout Function ---
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

function formatDate(dateObj) {
  if (!dateObj) return "—";
  const date = new Date(dateObj);
  const options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  return date.toLocaleString("en-IN", options).replace(",", "") + " (IST)";
}

// --- Load Donations from Firestore ---
async function loadDonations() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;
  donationsTable.innerHTML = "";
  donationRows = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    const status = data.status || (data.paymentMethod === "cashfree" ? "PENDING" : "confirmed");
    const method = data.paymentMethod === "cashfree" ? "Cashfree" : "Manual UPI";

    if (status === "SUCCESS" || status === "confirmed") {
      total += Number(data.amount) || 0;
    }

    const formattedDate = data.date
      ? data.date
      : data.timestamp
      ? formatDate(data.timestamp.toDate())
      : "—";

    const row = document.createElement("tr");
    const mobile = data.phone ? `${data.countryCode || ""} ${data.phone}` : "—";
    row.innerHTML = `
      <td>${data.name || "-"}</td>
      <td>${data.email || "-"}</td>
      <td>${mobile}</td>
      <td>₹${data.amount || 0}</td>
      <td>${data.txnID || data.orderId || "—"}</td>
      <td>${formattedDate}</td>
      <td>${method}</td>
      <td>${status}</td>`;
    donationsTable.appendChild(row);

    donationRows.push({
      name: data.name || "-",
      email: data.email || "-",
      mobile,
      amount: data.amount || 0,
      txn: data.txnID || data.orderId || "—",
      date: formattedDate,
      method,
      status,
    });
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / 20000) * 100, 100);
  progressBar.style.width = `${percent}%`;
}

// --- CSV Export ---
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const header = ["Name", "E-Mail", "Mobile", "Amount", "Transaction ID", "Date & Time", "Payment Method", "Status"];
    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const rows = donationRows.map((r) =>
      [r.name, r.email, r.mobile, r.amount, r.txn, r.date, r.method, r.status].map(escape).join(",")
    );
    const csv = [header.map(escape).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fundverse-donations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

// --- Footer Auto-Year ---
if (footer)
  footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | Created by Kushal Mitra & AI`;
