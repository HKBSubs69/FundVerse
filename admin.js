// ===========================
// FundVerse Admin Panel (FINAL FIXED)
// ===========================

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
const GOAL_AMOUNT = 20000;

// Load donations live
function loadDonations() {
  db.collection("ComicProjectDonations").orderBy("timestamp", "desc").onSnapshot(snapshot => {
    donationTable.innerHTML = "";
    let total = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const name = data.name || "N/A";
      const email = data.email || "N/A";
      const amount = Number(data.amount) || 0;
      const txnId = data.txnID || "Not Provided";

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

      donationTable.innerHTML += `
        <tr>
          <td>${name}</td>
          <td>${email}</td>
          <td>₹${amount}</td>
          <td>${txnId}</td>
          <td>${formattedDate}</td>
        </tr>
      `;
    });

    totalRaisedElem.textContent = `₹${total.toLocaleString()}`;
    const progressPercent = Math.min((total / GOAL_AMOUNT) * 100, 100);
    progressBar.style.width = `${progressPercent}%`;
    progressBar.setAttribute("aria-valuenow", progressPercent);
  });
}

// Logout (if Auth enabled)
logoutBtn.addEventListener("click", () => {
  firebase.auth().signOut().then(() => {
    window.location.href = "index.html";
  }).catch(err => console.error(err));
});

// Auto Year
document.getElementById("year").textContent = new Date().getFullYear();

// Init
loadDonations();
