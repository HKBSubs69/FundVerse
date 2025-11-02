// -------------------------------
// admin.js (Firebase v8) 
// Secure Admin: requires Auth + whitelist in Firestore
// -------------------------------

/* FIREBASE CONFIG */
var firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/* DOM elements */
const loginSection = document.getElementById("login-section");
const dashboard = document.getElementById("dashboard");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginError = document.getElementById("login-error");

const donationsTable = document.getElementById("donations-table");
const totalRaisedEl = document.getElementById("total-raised");
const progressBar = document.getElementById("progress-bar");
const footer = document.getElementById("footer");

const GOAL_AMOUNT = 20000;

/* helper: format Firestore timestamp to IST string */
function formatTimestampToIST(timestamp) {
  if (!timestamp) return "—";
  // if it's a Firestore Timestamp object
  if (timestamp.seconds) {
    const d = new Date(timestamp.seconds * 1000);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata"
    }) + " (IST)";
  }
  // fallback
  const d = new Date(timestamp);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata"
  }) + " (IST)";
}

/* load donations and compute totals (only callable when admin authorized) */
async function loadDonations() {
  try {
    const snap = await db.collection("ComicProjectDonations").orderBy("timestamp", "desc").get();
    donationsTable.innerHTML = "";
    let total = 0;

    snap.forEach(doc => {
      const d = doc.data();
      const name = d.name || "—";
      const email = d.email || "—";
      const amount = d.amount || 0;
      // Accept txnID field name exactly as you said
      const txn = d.txnID || d.txnId || "—";
      const ts = d.timestamp || d.date || null;

      total += Number(amount);

      const row = `<tr>
        <td>${name}</td>
        <td>${email}</td>
        <td>₹${amount}</td>
        <td>${txn}</td>
        <td>${formatTimestampToIST(ts)}</td>
      </tr>`;
      donationsTable.insertAdjacentHTML("beforeend", row);
    });

    totalRaisedEl.textContent = `₹${total.toLocaleString("en-IN")}`;
    const percent = Math.min((total / GOAL_AMOUNT) * 100, 100);
    progressBar.style.width = `${percent}%`;
  } catch (err) {
    console.error("loadDonations error:", err);
  }
}

/* --- Admin whitelist check:
   We'll allow dashboard only if signed-in user's UID exists
   as a document under collection 'AdminUsers' (doc id = uid).
   To add yourself: after you sign in once, create a document
   in Firestore: AdminUsers -> <your-uid> (empty doc is fine).
*/
async function isAdminAllowed(uid) {
  try {
    if (!uid) return false;
    const doc = await db.collection("AdminUsers").doc(uid).get();
    return doc.exists;
  } catch (e) {
    console.error("isAdminAllowed error:", e);
    return false;
  }
}

/* Auth flow */

/* Keep session persistence so refresh keeps you logged in */
auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
  .catch(err => console.warn("persistence error", err));

/* On auth change: check admin whitelist and show/hide dashboard */
auth.onAuthStateChanged(async (user) => {
  if (user) {
    // check whitelist
    const allowed = await isAdminAllowed(user.uid);
    if (!allowed) {
      // not allowed -> sign out immediately and show message
      await auth.signOut();
      loginError.textContent = "Access denied. Contact site owner.";
      loginSection.style.display = "block";
      dashboard.style.display = "none";
      return;
    }
    // allowed -> show dashboard
    loginSection.style.display = "none";
    dashboard.style.display = "block";
    loginError.textContent = "";
    await loadDonations();
  } else {
    // not signed in
    loginSection.style.display = "block";
    dashboard.style.display = "none";
  }
});

/* Login button */
loginBtn.addEventListener("click", async () => {
  loginError.textContent = "";
  const email = document.getElementById("admin-email").value.trim();
  const pw = document.getElementById("admin-password").value.trim();
  if (!email || !pw) {
    loginError.textContent = "Enter email and password.";
    return;
  }
  try {
    await auth.signInWithEmailAndPassword(email, pw);
    // auth.onAuthStateChanged will handle whitelist & dashboard
  } catch (err) {
    console.error("login error", err);
    loginError.textContent = "Login failed. Check credentials.";
  }
});

/* Logout button */
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  loginSection.style.display = "block";
  dashboard.style.display = "none";
});

/* footer */
footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;