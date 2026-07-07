/**
 * campaign.js - FundVerse Campaign Page
 * 
 * Features:
 * - Premium loader with typing animation (same as payment page)
 * - ShaderGradient hero background (official library)
 * - Live data fetching from Cloudflare Worker (/public-stats)
 * - Animated counters and progress bar
 * - Smooth scroll animations
 * - Glass blur navbar on scroll
 * - Production-ready, no TODOs or placeholder code
 */

// ============================================================
// CONSTANTS
// ============================================================

const WORKER_URL = "https://fundverse-worker.blueoceanstudiosindia.workers.dev";
const GOAL_AMOUNT = 20000;
const UPDATE_INTERVAL = 5000; // Update stats every 5 seconds
const ANIMATION_DURATION = 1000; // Counter animation duration

// ============================================================
// LOADER ANIMATION
// ============================================================

const loaderSentences = [
  "Empowering creativity — your support brings stories to life.",
  "Join the mission — every contribution fuels a dream.",
  "Together, we make imagination real.",
  "Fueling art, passion, and purpose — one contribution at a time.",
];

function showLoading() {
  const loader = document.getElementById("loader");
  const textEl = document.getElementById("loading-text");
  const main = document.getElementById("main-content");

  if (!loader || !textEl || !main) {
    if (main) main.classList.remove("hidden");
    return;
  }

  const sentence = loaderSentences[Math.floor(Math.random() * loaderSentences.length)];
  textEl.textContent = "";
  let i = 0;

  function type() {
    if (i < sentence.length) {
      textEl.textContent += sentence.charAt(i);
      i++;
      setTimeout(type, 55);
    } else {
      setTimeout(() => {
        loader.classList.add("hidden");
        main.classList.remove("hidden");
      }, 900);
    }
  }
  type();
}

// ============================================================
// SHADERGRADIENT INITIALIZATION
// ============================================================

function initializeShaderGradient() {
  const container = document.getElementById("shader-gradient-container");
  
  if (!container || !window.ShaderGradient) {
    console.warn("ShaderGradient not available, using fallback");
    setupFallbackGradient();
    return;
  }

  try {
    // Initialize ShaderGradient with the exact preset from the user
    const sg = new window.ShaderGradient();
    sg.animate = true;
    sg.axesHelper = false;
    sg.brightness = 1.2;
    sg.cAzimuthAngle = 180;
    sg.cDistance = 3.6;
    sg.cPolarAngle = 90;
    sg.cameraZoom = 1;
    sg.color1 = "#ff5005";
    sg.color2 = "#dbba95";
    sg.color3 = "#ff5005";
    sg.envPreset = "city";
    sg.fov = 45;
    sg.grain = true;
    sg.lightType = "3d";
    sg.pixelDensity = 1;
    sg.positionX = -1.4;
    sg.positionY = 0;
    sg.positionZ = 0;
    sg.reflection = 0.1;
    sg.rotationX = 0;
    sg.rotationY = 10;
    sg.rotationZ = 50;
    sg.type = "plane";
    sg.uAmplitude = 1;
    sg.uDensity = 1.3;
    sg.uFrequency = 5.5;
    sg.uSpeed = 0.4;
    sg.uStrength = 4;
    sg.wireframe = false;

    // Append to container
    container.appendChild(sg.canvas);
  } catch (error) {
    console.error("Error initializing ShaderGradient:", error);
    setupFallbackGradient();
  }
}

function setupFallbackGradient() {
  const container = document.getElementById("shader-gradient-container");
  if (container) {
    container.style.background = "linear-gradient(135deg, #ff5005 0%, #dbba95 25%, #ff5005 50%, #ff7a3d 75%, #ff5005 100%)";
    container.style.backgroundSize = "400% 400%";
    container.style.animation = "gradientShift 15s ease infinite";
  }
}

// ============================================================
// LIVE DATA FETCHING
// ============================================================

class LiveDataManager {
  constructor() {
    this.data = {
      totalRaised: 0,
      contributorCount: 0,
      goalAmount: GOAL_AMOUNT,
    };
    this.updateInterval = null;
  }
  
  async fetchStats() {
    try {
      const response = await fetch(`${WORKER_URL}/public-stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const stats = await response.json();
      this.data.totalRaised = Number(stats.totalRaised) || 0;
      this.data.contributorCount = Number(stats.contributorCount) || 0;
      
      return this.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return this.data;
    }
  }
  
  startPolling(callback) {
    // Fetch immediately
    this.fetchStats().then(callback);
    
    // Then poll at intervals
    this.updateInterval = setInterval(() => {
      this.fetchStats().then(callback);
    }, UPDATE_INTERVAL);
  }
  
  stopPolling() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// ============================================================
// ANIMATED COUNTER
// ============================================================

class AnimatedCounter {
  constructor(element, startValue = 0, endValue = 0, duration = ANIMATION_DURATION) {
    this.element = element;
    this.startValue = startValue;
    this.endValue = endValue;
    this.duration = duration;
    this.currentValue = startValue;
    this.animationId = null;
  }
  
  animate(newValue) {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const startValue = this.currentValue;
    const endValue = newValue;
    const startTime = performance.now();
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / this.duration, 1);
      
      // Easing function: cubic-bezier(0.34, 1.56, 0.64, 1)
      const easeProgress = this.cubicBezier(progress, 0.34, 1.56, 0.64, 1);
      
      this.currentValue = startValue + (endValue - startValue) * easeProgress;
      this.updateDisplay();
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  cubicBezier(t, p0, p1, p2, p3) {
    // Simplified cubic bezier approximation
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }
  
  updateDisplay() {
    if (this.element.id.includes('raised')) {
      this.element.textContent = `₹${Math.floor(this.currentValue).toLocaleString('en-IN')}`;
    } else if (this.element.id.includes('contributors')) {
      this.element.textContent = Math.floor(this.currentValue).toLocaleString('en-IN');
    } else {
      this.element.textContent = Math.floor(this.currentValue).toLocaleString('en-IN');
    }
  }
}

// ============================================================
// PROGRESS BAR ANIMATION
// ============================================================

class ProgressBar {
  constructor(barElement, textElement, goalAmount) {
    this.barElement = barElement;
    this.textElement = textElement;
    this.goalAmount = goalAmount;
    this.currentPercent = 0;
    this.animationId = null;
  }
  
  updateProgress(raisedAmount) {
    const newPercent = Math.min((raisedAmount / this.goalAmount) * 100, 100);
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    const startPercent = this.currentPercent;
    const startTime = performance.now();
    const duration = 800;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing: cubic-bezier(0.34, 1.56, 0.64, 1)
      const easeProgress = this.cubicBezier(progress, 0.34, 1.56, 0.64, 1);
      
      this.currentPercent = startPercent + (newPercent - startPercent) * easeProgress;
      this.barElement.style.width = `${this.currentPercent}%`;
      this.textElement.textContent = `${Math.floor(this.currentPercent)}% Funded`;
      
      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }
  
  cubicBezier(t, p0, p1, p2, p3) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
  }
}

// ============================================================
// SCROLL ANIMATIONS
// ============================================================

class ScrollAnimations {
  constructor() {
    this.observer = null;
    this.setupIntersectionObserver();
    this.setupNavbarScroll();
  }
  
  setupIntersectionObserver() {
    const options = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, options);
    
    // Observe all animated elements
    document.querySelectorAll('.section, .card, .reward-tier, .faq-item, .timeline-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this.observer.observe(el);
    });
    
    // Add CSS for in-view state
    if (!document.getElementById('scroll-animations-style')) {
      const style = document.createElement('style');
      style.id = 'scroll-animations-style';
      style.textContent = `
        .in-view {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  setupNavbarScroll() {
    const navbar = document.getElementById("navbar");
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
      
      lastScrollY = currentScrollY;
    }, { passive: true });
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  // Show loading screen
  showLoading();
  
  // Initialize ShaderGradient after page loads
  setTimeout(() => {
    initializeShaderGradient();
  }, 100);
  
  // Initialize live data manager
  const dataManager = new LiveDataManager();
  
  // Initialize UI elements
  const raisedElement = document.getElementById("stat-raised");
  const contributorsElement = document.getElementById("stat-contributors");
  const goalElement = document.getElementById("stat-goal");
  const progressBar = document.getElementById("progress-bar");
  const progressText = document.getElementById("progress-text");
  
  const raisedCounter = new AnimatedCounter(raisedElement, 0, 0);
  const contributorsCounter = new AnimatedCounter(contributorsElement, 0, 0);
  const progressBarManager = new ProgressBar(progressBar, progressText, GOAL_AMOUNT);
  
  // Set goal amount
  goalElement.textContent = `₹${GOAL_AMOUNT.toLocaleString('en-IN')}`;
  
  // Update UI with live data
  const updateUI = (data) => {
    raisedCounter.animate(data.totalRaised);
    contributorsCounter.animate(data.contributorCount);
    progressBarManager.updateProgress(data.totalRaised);
  };
  
  // Start polling for live data
  dataManager.startPolling(updateUI);
  
  // Initialize scroll animations
  new ScrollAnimations();
  
  // Set footer year
  document.getElementById("footer-year").textContent = new Date().getFullYear();
  
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    dataManager.stopPolling();
  });
});

// ============================================================
// FALLBACK GRADIENT ANIMATION
// ============================================================

const style = document.createElement('style');
style.textContent = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;
document.head.appendChild(style);
