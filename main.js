// main.js (non-module; for Firebase v8)
// Defensive — checks DOM elements and logs errors

(function () {
  // Firebase configuration (you already provided these keys)
  var firebaseConfig = {
    apiKey: "AIzaSyBV43M4YLgRrTZ4_Pavs2DuaTyRNxkwSEM",
    authDomain: "fundverse-f3b0c.firebaseapp.com",
    projectId: "fundverse-f3b0c",
    storageBucket: "fundverse-f3b0c.firebasestorage.app",
    messagingSenderId: "125480706897",
    appId: "1:125480706897:web:6a8cddc96fb0dd2f936970"
  };

  // Initialize Firebase (v8)
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.error("Firebase init error:", e);
  }
  var db = firebase.firestore();

  // Config / constants
  var GOAL = 20000;
  var UPI_ID = "7079441779@ikwik";

  // DOM elements (will be assigned after DOMContentLoaded)
  var loader, mainContent, progressBar, raisedAmount;
  var donationForm, paymentOption, upiDisplay, upiText, upiCanvas, txnInput;
  var donateBtn, footerEl;

  function safeGet(id) {
    var el = document.getElementById(id);
    if (!el) console.warn("Missing element:", id);
    return el;
  }

  // Wait for DOM
  document.addEventListener("DOMContentLoaded", function () {
    loader = safeGet("loader");
    mainContent = safeGet("main-content");
    progressBar = safeGet("progress-bar");
    raisedAmount = safeGet("raised-amount");
    donationForm = safeGet("donationForm");
    paymentOption = safeGet("payment-option");
    upiDisplay = safeGet("upi-display");
    upiText = safeGet("upi-text");
    upiCanvas = safeGet("upi-qr");
    txnInput = safeGet("txnId");
    donateBtn = safeGet("donate-btn");
    footerEl = safeGet("footer");
    // show loader for 1.5 seconds then show content
    setTimeout(function () {
      if (loader) loader.style.display = "none";
      if (mainContent) mainContent.classList.remove("hidden");
      updateProgress().catch(function (e) { console.error(e); });
    }, 1500);

    // Payment option handling
    if (paymentOption) {
      paymentOption.addEventListener("change", function (e) {
        var opt = e.target.value;
        var amount = parseFloat((safeGet("amount") && safeGet("amount").value) || 0);
        if (!amount || amount <= 0) {
          alert("Please enter a valid amount first.");
          e.target.value = "";
          return;
        }
        if (upiDisplay) upiDisplay.classList.remove("hidden");

        if (opt === "upi-id") {
          if (upiText) {
            upiText.textContent = UPI_ID + "  (tap to open UPI app)";
            upiText.style.cursor = "pointer";
            upiText.onclick = function () {
              var url = "upi://pay?pa=" + encodeURIComponent(UPI_ID) + "&pn=" + encodeURIComponent("FundVerse") + "&am=" + encodeURIComponent(amount) + "&cu=INR";
              // Redirect to UPI intent
              window.location.href = url;
            };
          }
          if (upiCanvas) upiCanvas.style.display = "none";
        } else if (opt === "upi-qr") {
          if (upiText) upiText.textContent = "";
          if (upiCanvas) {
            upiCanvas.style.display = "block";
            var qrData = "upi://pay?pa=" + UPI_ID + "&pn=" + encodeURIComponent("FundVerse") + "&am=" + encodeURIComponent(amount) + "&cu=INR";
            try {
              QRCode.toCanvas(upiCanvas, qrData, { width: 220 }, function (err) {
                if (err) console.error("QR error:", err);
              });
            } catch (err) {
              console.error("QR generation failed", err);
            }
          }
        }
      });
    }

    // Form submit
    if (donationForm) {
      donationForm.addEventListener("submit", async function (ev) {
        ev.preventDefault();
        // validate fields
        var name = (safeGet("name") && safeGet("name").value.trim()) || "";
        var email = (safeGet("email") && safeGet("email").value.trim()) || "";
        var amount = parseFloat((safeGet("amount") && safeGet("amount").value) || 0);
        var txn = (txnInput && txnInput.value.trim()) || "";

        if (!name || !email || !amount || !txn) {
          alert("Please fill all required fields (name, email, amount, transaction ID).");
          return;
        }

        // formatted date in IST
        var now = new Date();
        var formatted = now.toLocaleString("en-IN", {
          day: "2-digit", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata"
        }).replace("am", "AM").replace("pm", "PM");

        try {
          await db.collection("ComicProjectDonations").add({
            name: name,
            email: email,
            amount: amount,
            txnID: txn,
            date: formatted,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });

          // if you want to send email via EmailJS, call emailjs.send(...) here (you configured service)
          alert("🎉 Thank you! Donation recorded. Please wait while we update the total.");
          donationForm.reset();
          if (upiDisplay) upiDisplay.classList.add("hidden");
          await updateProgress();
        } catch (err) {
          console.error("Error saving donation:", err);
          alert("Error saving donation. Check console.");
        }
      });
    }

    // Footer
    if (footerEl) {
      footerEl.innerHTML = "© FundVerse " + new Date().getFullYear() + " | Managed by Blue Ocean Studios India | Made in India 🇮🇳 | All Rights Reserved | Created by Kushal Mitra & AI";
    }
  }); // DOMContentLoaded

  // update progress function
  async function updateProgress() {
    try {
      var snapshot = await db.collection("ComicProjectDonations").get();
      var total = 0;
      snapshot.forEach(function (doc) {
        var d = doc.data();
        var a = parseFloat(d.amount) || 0;
        total += a;
      });
      if (raisedAmount) {
        raisedAmount.textContent = "Raised: ₹" + total.toLocaleString("en-IN") + " / ₹" + GOAL.toLocaleString("en-IN");
      }
      if (progressBar) {
        var percent = Math.min((total / GOAL) * 100, 100);
        progressBar.style.width = percent + "%";
      }
    } catch (err) {
      console.error("updateProgress error:", err);
      // On failure show 0 but don't break
      if (raisedAmount) raisedAmount.textContent = "Raised: ₹0 / ₹" + GOAL.toLocaleString("en-IN");
      if (progressBar) progressBar.style.width = "0%";
    }
  }

})();