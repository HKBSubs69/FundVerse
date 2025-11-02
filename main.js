import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

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
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// Typing text
const message = "💫 Making dreams possible, one donation at a time...";

// Typing effect
function typeText(el, text, speed = 60) {
  if (!el) return;
  el.textContent = "";
  let i = 0;
  const caret = document.createElement("span");
  caret.style.borderRight = "3px solid #ff7676";
  caret.style.marginLeft = "5px";
  el.appendChild(caret);

  const typing = setInterval(() => {
    if (i < text.length) {
      el.textContent = text.slice(0, i + 1);
      el.appendChild(caret);
      i++;
    } else {
      clearInterval(typing);
      setInterval(() => {
        caret.style.borderColor = caret.style.borderColor ? "" : "#ff7676";
      }, 600);
    }
  }, speed);
}

document.addEventListener("DOMContentLoaded", () => {
  const loader = document.getElementById("loader");
  const mainContent = document.getElementById("main-content");
  const text = document.getElementById("loading-text");
  typeText(text, message, 55);

  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => {
      loader.style.display = "none";
      mainContent.classList.remove("hidden");
    }, 500);
    updateProgress();
  }, 1800);

  const form = document.getElementById("donationForm");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const paymentOption = document.getElementById("payment-option");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");
  const footer = document.getElementById("footer");

  async function updateProgress() {
    try {
      const snap = await getDocs(collection(db, "ComicProjectDonations"));
      let total = 0;
      snap.forEach((d) => total += Number(d.data().amount) || 0);
      const percent = Math.min((total / goalAmount) * 100, 100);
      progressBar.style.width = `${percent}%`;
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString("en-IN")} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (err) {
      console.error(err);
    }
  }

  if (paymentOption) {
    paymentOption.addEventListener("change", (e) => {
      const option = e.target.value;
      const amount = document.getElementById("amount").value.trim();
      if (!amount || amount <= 0) {
        alert("Enter a valid amount first.");
        e.target.value = "";
        return;
      }
      upiDisplay.classList.remove("hidden");

      if (option === "upi-id") {
        upiText.textContent = `${upiID} (Tap to Pay)`;
        qrCanvas.style.display = "none";
        upiText.onclick = () => {
          const url = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
          window.location.href = url;
        };
      } else if (option === "upi-qr") {
        upiText.textContent = "";
        qrCanvas.style.display = "block";
        const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;
        QRCode.toCanvas(qrCanvas, qrData, { width: 200 });
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const amount = parseFloat(document.getElementById("amount").value);
      const txnId = document.getElementById("txnId").value.trim();
      if (!name || !email || !amount || !txnId) return alert("Please fill all fields!");

      const now = new Date();
      const options = {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
      };
      let formatted = now.toLocaleString("en-IN", options).replace("am", "AM").replace("pm", "PM") + " (IST)";

      try {
        await addDoc(collection(db, "ComicProjectDonations"), {
          name, email, amount, txnID: txnId, date: formatted, timestamp: serverTimestamp()
        });
        alert("🎉 Thank you for contributing!");
        form.reset();
        upiDisplay.classList.add("hidden");
        updateProgress();
      } catch (err) {
        console.error("Error:", err);
        alert("Something went wrong. Try again!");
      }
    });
  }

  if (footer) {
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI`;
  }
});