// FundVerse Admin Panel (FINAL)
// Shows live donations, totals, and supports secure Firebase integration

const firebaseConfig = {
  apiKey: "AIzaSyCw6vmrE7F1-sZmfY4_LFHDyEEcvZp4TQE",
  authDomain: "fundverse-app.firebaseapp.com",
  projectId: "fundverse-app",
  storageBucket: "fundverse-app.appspot.com",
  messagingSenderId: "1072202828884",
  appId: "1:1072202828884:web:12828d1f96ed6bdf4eec82"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elements
const donationTable = document.getElementById("donation-table");
const totalRaisedElem = document.getElementById("total-raised");
const progressBar = document.querySelector(".progress-bar-fill");
const logoutBtn = document.getElementById("logout-btn");

// Project goal
const GOAL_AMOUNT = 20000;

// Fetch Donations
function loadDonations() {
  db.collection("ComicProjectDonations").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    let total = 0;
    donationTable.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || "N/A";
      const email = data.email || "N/A";
      const amount = Number(data.amount) || 0;
      const txnId = data.txnId || "N/A";

      let formattedDate = "Invalid Date";
      if (data.timestamp && data.timestamp.toDate) {
        const dateObj = data.timestamp.toDate();
        formattedDate = dateObj.toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });
      }

      total += amount;

      const row = `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td>₹${amount}</td>
          <td>${txnId}</td>
          <td>${formattedDate}</td>
        </tr>
      `;
      donationTable.innerHTML += row;
    });

    totalRaisedElem.textContent = `₹${total.toLocaleString()}`;
    const progress = Math.min((total / GOAL_AMOUNT) * 100, 100);
    progressBar.style.width = `${progress}%`;
  });
}

// Logout (if Firebase Auth is used)
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      window.location.href = "index.html";
    }).catch(err => console.error(err));
  });
}

// Auto Year Footer
document.getElementById("year").textContent = new Date().getFullYear();

// Initialize
loadDonations();
