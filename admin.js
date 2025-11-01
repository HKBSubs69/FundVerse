import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginSection = document.getElementById("loginSection");
const dashboardSection = document.getElementById("dashboardSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const donationTable = document.getElementById("donationTable");
const totalRaised = document.getElementById("totalRaised");
const loginMessage = document.getElementById("loginMessage");

// Login
loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value.trim();
  const password = document.getElementById("adminPassword").value.trim();

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginSection.classList.add("hidden");
    dashboardSection.classList.remove("hidden");
    loadDonations();
  } catch (error) {
    loginMessage.textContent = "Invalid credentials!";
    loginMessage.style.color = "red";
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  dashboardSection.classList.add("hidden");
  loginSection.classList.remove("hidden");
});

// Load live donations
function loadDonations() {
  const donationsRef = collection(db, "ComicProjectDonations");
  onSnapshot(donationsRef, (snapshot) => {
    donationTable.innerHTML = "";
    let total = 0;

    snapshot.forEach((doc) => {
      const d = doc.data();
      total += Number(d.amount);
      const row = `
        <tr>
          <td>${d.name}</td>
          <td>${d.email}</td>
          <td>₹${d.amount}</td>
          <td>${d.transactionId}</td>
          <td>${d.time}</td>
        </tr>
      `;
      donationTable.innerHTML += row;
    });

    totalRaised.textContent = total.toLocaleString();
  });
}