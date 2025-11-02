// Firebase modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth,
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

// Redirect if not logged in
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDonations();
  } else {
    // Redirect to Firebase hosted login page
    window.location.href = `https://${firebaseConfig.authDomain}/__/auth/handler`;
  }
});

// Logout
document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.reload();
});

// Load donations
async function loadDonations() {
  const donationsTable = document.getElementById("donations-table");
  const totalRaised = document.getElementById("total-raised");
  const progressBar = document.getElementById("progress-bar");
  const goal = 20000;

  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0;

  donationsTable.innerHTML = "";
  snapshot.forEach((doc) => {
    const d = doc.data();
    const amount = Number(d.amount) || 0;
    total += amount;

    const row = `
      <tr>
        <td>${d.name || "—"}</td>
        <td>${d.email || "—"}</td>
        <td>₹${amount}</td>
        <td>${d.txnID || "N/A"}</td>
        <td>${d.date || new Date().toLocaleString("en-IN", { hour12: true }).replace("am", "AM").replace("pm", "PM")}</td>
      </tr>
    `;
    donationsTable.innerHTML += row;
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  progressBar.style.width = `${(total / goal) * 100}%`;

  document.getElementById("footer").innerHTML = 
    `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | Created by Kushal Mitra & AI`;
}