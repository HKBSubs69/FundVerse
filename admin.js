import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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

const USER = "FundVerseAdmin";
const PASS = "FundVerse@2025"; // secure password known only to you

const loginBox = document.getElementById("login-box");
const dashboard = document.getElementById("dashboard");
const errorMsg = document.getElementById("error-msg");
const totalAmount = document.getElementById("totalAmount");
const totalCount = document.getElementById("totalCount");
const lastUpdated = document.getElementById("lastUpdated");
const donationTable = document.getElementById("donationTable");

document.getElementById("login-btn").addEventListener("click", () => {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === USER && pass === PASS) {
    loginBox.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadData();
  } else {
    errorMsg.textContent = "❌ Invalid Credentials";
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  dashboard.classList.add("hidden");
  loginBox.classList.remove("hidden");
});

async function loadData() {
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
  let total = 0, count = 0;
  donationTable.innerHTML = "";
  snapshot.forEach((doc) => {
    const d = doc.data();
    total += parseInt(d.amount || 0);
    count++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${d.name}</td>
      <td>${d.email}</td>
      <td>₹${d.amount}</td>
      <td>${d.txnId}</td>
      <td>${new Date(d.timestamp).toLocaleString()}</td>`;
    donationTable.appendChild(tr);
  });
  totalAmount.textContent = `💰 Total Raised: ₹${total}`;
  totalCount.textContent = `🙌 Total Donors: ${count}`;
  lastUpdated.textContent = `🕓 Last Updated: ${new Date().toLocaleString()}`;
}

document.getElementById("footer").innerHTML = 
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;
