import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let donationsData = [];

// Fade out loader after 2 seconds
window.addEventListener("load", () => {
  setTimeout(() => {
    const loader = document.getElementById("loader");
    const main = document.getElementById("main-content");
    loader.style.opacity = "0";
    loader.style.transition = "opacity 1s ease";
    setTimeout(() => {
      loader.style.display = "none";
      main.classList.remove("hidden");
    }, 1000);
  }, 2000);
});

// Fetch Donations
async function loadDonations() {
  const tableBody = document.getElementById("donations-table");
  const totalRaised = document.getElementById("total-raised");
  const progressBar = document.getElementById("progress-bar");
  const snapshot = await getDocs(collection(db, "ComicProjectDonations"));

  let total = 0;
  donationsData = [];

  snapshot.forEach((doc) => {
    const d = doc.data();
    donationsData.push(d);
    total += Number(d.amount) || 0;
  });

  totalRaised.textContent = `₹${total.toLocaleString("en-IN")}`;
  const percent = Math.min((total / 20000) * 100, 100);
  progressBar.style.width = `${percent}%`;

  tableBody.innerHTML = "";
  donationsData.forEach((d) => {
    const row = `
      <tr>
        <td>${d.name || "-"}</td>
        <td>${d.email || "-"}</td>
        <td>₹${d.amount || 0}</td>
        <td>${d.txnID || d.txnId || "N/A"}</td>
        <td>${d.date || ""}</td>
      </tr>`;
    tableBody.innerHTML += row;
  });
}

document.addEventListener("DOMContentLoaded", loadDonations);

// CSV Download
document.getElementById("download-btn").addEventListener("click", () => {
  if (!donationsData.length) {
    alert("No data to export yet!");
    return;
  }

  const csv = [
    ["Name", "E-Mail", "Amount", "Transaction ID", "Date & Time"],
    ...donationsData.map(d => [
      d.name || "-",
      d.email || "-",
      d.amount || "0",
      d.txnID || d.txnId || "N/A",
      d.date || ""
    ]),
  ].map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `FundVerse_Donations_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});