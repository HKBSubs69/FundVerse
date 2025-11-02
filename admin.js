// Firebase modular (v12)
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

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Elements
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const loginError = document.getElementById("login-error");

const goalAmount = 20000;

// Listen for login state
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

// Login button
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginError.textContent = "";
  } catch (error) {
    loginError.textContent = "Access Denied! Invalid credentials.";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Load Firestore data
async function loadDonations() {
  try {
    const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
    let total = 0;
    donationsTable.innerHTML = "";

    snapshot.forEach((doc) => {
      const data = doc.data();
      const amount = Number(data.amount) || 0;
      total += amount;

      const txn = data.txnID || "N/A";
      const date = data.date
        ? data.date
        : new Date(data.timestamp?.seconds * 1000 || Date.now())
            .toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: "Asia/Kolkata",
            })
            .replace("am", "AM")
            .replace("pm", "PM");

      const row = `
        <tr>
          <td>${data.name || "—"}</td>
          <td>${data.email || "—"}</td>
          <td>₹${amount.toLocaleString("en-IN")}</td>
          <td>${txn}</td>
          <td>${date}</td>
        </tr>
      `;
      donationsTable.innerHTML += row;
    });

    totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
    const percent = Math.min((total / goalAmount) * 100, 100);
    progressBar.style.width = `${percent}%`;
  } catch (err) {
    console.error("Error loading donations:", err);
  }
}

// Footer
document.getElementById("footer").innerHTML = 
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;