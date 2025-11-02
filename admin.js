import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore, collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
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

const loginCard = document.getElementById("login-card");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadDonations();
  } else {
    loginCard.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }
});

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Access denied. Invalid email or password.");
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

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
    const txn = d.txnID || "N/A";
    const formattedDate = d.date
      ? d.date.replace("pm", "PM").replace("am", "AM")
      : new Date().toLocaleString("en-IN", { hour12: true }).replace("pm", "PM").replace("am", "AM");

    donationsTable.innerHTML += `
      <tr>
        <td>${d.name || "—"}</td>
        <td>${d.email || "—"}</td>
        <td>₹${amount}</td>
        <td>${txn}</td>
        <td>${formattedDate}</td>
      </tr>`;
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  progressBar.style.width = `${(total / goal) * 100}%`;
}