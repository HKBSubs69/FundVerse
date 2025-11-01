// main.js — final fixed (module style)
// this file expects index.html to include: <script type="module" src="main.js" defer></script>

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

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
const collRef = collection(db, "ComicProjectDonations");

// DOM
const donationForm = document.getElementById("donationForm");
const amountInput = document.getElementById("amount");
const paymentOption = document.getElementById("paymentOption");
const upiDetails = document.getElementById("upiDetails");
const upiText = document.getElementById("upiText");
const qrCanvasOrImage = document.getElementById("qrCanvas"); // canvas element exists in your HTML
const raisedAmount = document.getElementById("raisedAmount");
const progressBar = document.getElementById("progressBar");

// Use your UPI ID
const UPI_ID = "7079441779@ikwik";
const GOAL = 20000;

// helper to create upi link
function makeUpiLink(amount) {
  const pa = encodeURIComponent(UPI_ID);
  const pn = encodeURIComponent("FundVerse");
  const am = encodeURIComponent(amount);
  // standard UPI deep link
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR`;
}

// Show QR or UPI ID
paymentOption.addEventListener("change", () => {
  const sel = paymentOption.value;
  const amt = (amountInput.value && Number(amountInput.value)) ? amountInput.value : 0;
  if (!sel) {
    upiDetails.classList.add("hidden");
    upiText.innerHTML = "";
    if (qrCanvasOrImage) qrCanvasOrImage.classList.add("hidden");
    return;
  }

  const upiLink = makeUpiLink(amt);

  if (sel === "upiID") {
    upiDetails.classList.remove("hidden");
    if (qrCanvasOrImage) qrCanvasOrImage.classList.add("hidden");
    upiText.innerHTML = `<strong>UPI ID:</strong> <span style="color:var(--accent)">${UPI_ID}</span><br>
      <button id="openUpiBtn" style="margin-top:10px;padding:10px 14px;border-radius:10px;border:none;background:var(--accent);color:#fff;cursor:pointer">
        Open UPI App
      </button>`;
    // attach click to open deep link
    setTimeout(() => {
      const btn = document.getElementById("openUpiBtn");
      if (btn) btn.onclick = () => { window.location.href = upiLink; };
    }, 50);
  } else if (sel === "upiQR") {
    upiDetails.classList.remove("hidden");
    upiText.textContent = "Scan this QR to Pay:";
    // create QR via QRServer (simple image)
    const qrURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiLink)}`;
    if (qrCanvasOrImage) {
      qrCanvasOrImage.classList.remove("hidden");
      // if canvas exists, replace it with an image for simplicity
      // ensure we have an <img id="qrImage"> inside upiDetails
      let img = document.getElementById("qrImage");
      if (!img) {
        img = document.createElement("img");
        img.id = "qrImage";
        img.style.width = "220px";
        img.style.height = "220px";
        img.style.borderRadius = "12px";
        img.style.marginTop = "10px";
        img.alt = "QR Code";
        // append to upiDetails after upiText
        upiDetails.appendChild(img);
      }
      img.src = qrURL;
    }
  }
});


// Submit donation
donationForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = (donationForm.name.value || "").trim();
  const email = (donationForm.email.value || "").trim();
  const amount = Number(donationForm.amount.value || 0);
  const txn = (donationForm.txnId.value || "").trim();

  if (!name || !email || !amount || !txn) {
    alert("Please fill all fields (name, email, amount, transaction id).");
    return;
  }

  try {
    // Save with server timestamp
    await addDoc(collRef, {
      name,
      email,
      amount,
      txnID: txn,
      timestamp: serverTimestamp()
    });

    alert("Thank you — donation recorded. You can now share the page.");
    donationForm.reset();
    upiDetails.classList.add("hidden");
    const img = document.getElementById("qrImage");
    if (img) img.remove();
  } catch (err) {
    console.error("Error saving donation:", err);
    alert("Error saving donation — try again later.");
  }
});


// Live progress using onSnapshot
const q = query(collRef, orderBy("timestamp", "desc"));
onSnapshot(q, (snap) => {
  let total = 0;
  snap.forEach(doc => {
    const d = doc.data();
    total += Number(d.amount) || 0;
  });

  // update raised text and progress
  raisedAmount.textContent = `Raised: ₹${total.toLocaleString()} / ₹${GOAL.toLocaleString()}`;

  // if progressBar is <progress> element, set value attribute
  if (progressBar) {
    // if it's a <progress> element
    if (progressBar.tagName && progressBar.tagName.toLowerCase() === "progress") {
      progressBar.value = Math.min(total, GOAL);
      progressBar.max = GOAL;
    } else {
      // fallback: a div-based bar
      progressBar.style.width = `${Math.min((total / GOAL) * 100, 100)}%`;
    }
  }
});
