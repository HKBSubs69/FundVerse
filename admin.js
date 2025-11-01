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
const emailField = document.getElementById("admin-email");
const passField = document.getElementById("admin-password");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("login-error");

loginBtn.addEventListener("click", async () => {
  try {
    await auth.signInWithEmailAndPassword(
      emailField.value.trim(),
      passField.value.trim()
    );
  } catch (err) {
    errorMsg.textContent = "❌ " + err.message;
  }
});

auth.onAuthStateChanged(user => {
  if (user) {
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loadDonations();
  } else {
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

function loadDonations() {
  db.collection("ComicProjectDonations")
    .orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
      let total = 0;
      const tbody = document.getElementById("donations-table");
      tbody.innerHTML = "";
      snapshot.forEach(doc => {
        const d = doc.data();
        total += Number(d.amount);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${d.name}</td>
          <td>${d.email}</td>
          <td>₹${d.amount}</td>
          <td>${d.txnID || "N/A"}</td>
          <td>${d.timestamp || "—"}</td>`;
        tbody.appendChild(tr);
      });
      document.getElementById("total-raised").textContent = "₹" + total;
      document.getElementById("progress-bar").style.width =
        Math.min((total / 20000) * 100, 100) + "%";
    });
}

document.getElementById("footer").innerHTML =
  `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;