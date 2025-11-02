// --- Firebase v12 Modular SDK ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
  authDomain: "fundverse-f3b0c.firebaseapp.com",
  projectId: "fundverse-f3b0c",
  storageBucket: "fundverse-f3b0c.firebasestorage.app",
  messagingSenderId: "125480706897",
  appId: "1:125480706897:web:6a8cddc96fb0dd2f936970",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Constants ---
const goalAmount = 20000;
const upiID = "7079441779@ikwik";

// --- Loader Lines ---
const lines = [
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels a dream.",
  "Together, we make imagination real.",
  "Fueling art, passion, and purpose — one donation at a time.",
];

// --- Show Loader Once ---
function showLoading() {
  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loading-text");
  const main = document.getElementById("main-content");

  if (!loader || !textEl || !main) {
    if (main) main.classList.remove("hidden");
    return;
  }

  const line = lines[Math.floor(Math.random() * lines.length)];
  textEl.textContent = "";
  let i = 0;

  function type() {
    if (i < line.length) {
      textEl.textContent += line.charAt(i);
      i++;
      setTimeout(type, 55);
    } else {
      setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.9s ease";
        setTimeout(() => {
          loader.style.display = "none";
          main.classList.remove("hidden");
          main.style.opacity = "1";
        }, 800);
      }, 1100);
    }
  }
  type();
}

// --- Firestore Logic ---
document.addEventListener("DOMContentLoaded", () => {
  showLoading();

  const form = document.getElementById("donationForm");
  const progressBar = document.getElementById("progress-bar");
  const raisedAmount = document.getElementById("raised-amount");
  const upiDisplay = document.getElementById("upi-display");
  const upiText = document.getElementById("upi-text");
  const qrCanvas = document.getElementById("upi-qr");

  // --- Update progress bar ---
  async function updateProgress() {
    if (!progressBar || !raisedAmount) return;
    try {
      const snapshot = await getDocs(collection(db, "ComicProjectDonations"));
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += Number(data.amount) || 0;
      });
      const percent = Math.min((total / goalAmount) * 100, 100);
      progressBar.style.width = `${percent}%`;
      raisedAmount.textContent = `Raised: ₹${total.toLocaleString(
        "en-IN"
      )} / ₹${goalAmount.toLocaleString("en-IN")}`;
    } catch (err) {
      console.error("updateProgress error:", err);
    }
  }

  // --- Payment Option Change ---
  const paymentOption = document.getElementById("payment-option");
  if (paymentOption) {
    paymentOption.addEventListener("change", async (e) => {
      const option = e.target.value;
      const amount = document.getElementById("amount")?.value?.trim() || "";
      if (!amount || Number(amount) <= 0) {
        alert("Please enter a valid amount first.");
        e.target.value = "";
        return;
      }

      upiDisplay?.classList.remove("hidden");

      const qrData = `upi://pay?pa=${upiID}&pn=FundVerse&am=${amount}&cu=INR`;

      if (option === "upi-id") {
        // Show UPI ID clickable link
        if (upiText) {
          upiText.innerHTML = `<strong>Send to:</strong> <span style="color:#3b82f6;font-weight:700;">${upiID}</span>`;
          upiText.onclick = () => {
            window.location.href = qrData;
          };
        }
        if (qrCanvas) qrCanvas.style.display = "none";
      } else if (option === "upi-qr") {
        // Show Dynamic QR
        if (upiText) upiText.innerHTML = "";
        if (qrCanvas) {
          qrCanvas.style.display = "block";
          try {
            // clear previous QR if any
            const ctx = qrCanvas.getContext("2d");
            ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
            await QRCode.toCanvas(qrCanvas, qrData, { width: 200 });
          } catch (err) {
            console.error("QR generation failed:", err);
          }
        }
      }
    });
  }

  // --- Submit Form ---
  form?.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    const name = document.getElementById("name")?.value?.trim() || "";
    const email = document.getElementById("email")?.value?.trim() || "";
    const amount = parseFloat(document.getElementById("amount")?.value || "0");
    const txnID = document.getElementById("txnId")?.value?.trim() || "";

    if (!name || !email || !amount || !txnID) {
      alert("Please fill all fields!");
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });

    try {
      await addDoc(collection(db, "ComicProjectDonations"), {
        name,
        email,
        amount,
        txnID,
        date: formattedDate,
        timestamp: serverTimestamp(),
      });
      alert("🎉 Thank you for your contribution!");
      form.reset();
      upiDisplay?.classList.add("hidden");
      await updateProgress();
    } catch (err) {
      console.error("save donation error:", err);
      alert("Unable to save donation. Try again.");
    }
  });

  // --- Footer ---
  const footer = document.getElementById("footer");
  if (footer) {
    footer.innerHTML = `© FundVerse ${new Date().getFullYear()} | Managed by <span style="color:#3b82f6;">Blue Ocean Studios India</span> | Made in India | Created by <span style="color:#3b82f6;">Kushal Mitra</span> & AI`;
  }

  updateProgress();
});