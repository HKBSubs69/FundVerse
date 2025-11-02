// Firebase v8 Admin Script
const firebaseConfig = {
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
const donationsTable = document.getElementById("donations-table");
const totalRaised = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const loginError = document.getElementById("login-error");

const goalAmount = 20000;

// Keep admin logged in
auth.onAuthStateChanged((user) => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    dashboard.style.display = "none";
    loginSection.style.display = "block";
  }
});

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("admin-email").value;
  const password = document.getElementById("admin-password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loginError.textContent = "";
    })
    .catch((error) => {
      loginError.textContent = "Access Denied! Invalid credentials.";
    });
});

logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Fetch donations
async function loadDonations() {
  const snapshot = await db.collection("ComicProjectDonations").get();
  let total = 0;
  donationsTable.innerHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    const amount = Number(data.amount) || 0;
    total += amount;

    const txn = data.txnID || "N/A";
    const date = data.date
      ? data.date
      : new Date(data.timestamp?.seconds * 1000 || Date.now()).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          timeZone: "Asia/Kolkata"
        }).replace("am", "AM").replace("pm", "PM");

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
}

// Footer
document.getElementById("footer").innerHTML = 
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;