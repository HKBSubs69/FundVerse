/**
 * campaign.js - FundVerse Campaign Page
 * 
 * Features:
 * - OGL-based animated silk shader (Aduza-inspired)
 * - Premium loader with typing animation
 * - Live data fetching from Cloudflare Worker (/public-stats)
 * - Animated counters and progress bar
 * - Smooth scroll animations
 * - Glass blur navbar on scroll
 * - Mobile-optimized, production-ready
 */

// ============================================================
// CONSTANTS
// ============================================================

const WORKER_URL = "https://fundverse-worker.blueoceanstudiosindia.workers.dev";
const GOAL_AMOUNT = 20000;
const UPDATE_INTERVAL = 5000;
const ANIMATION_DURATION = 1000;

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
// OGL SILK SHADER
// ============================================================

class SilkShader {
  constructor(container) {
    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.mesh = null;
    this.time = 0;
    this.animationId = null;
    this.dpr = Math.min(window.devicePixelRatio, 1.5); // Cap DPR for mobile
    
    this.init();
  }

  init() {
    if (!window.OGL) {
      console.warn("OGL not loaded, using fallback gradient");
      this.setupFallback();
      return;
    }

    try {
      const { Renderer, Camera, Transform, Plane, Program } = window.OGL;

      // Create renderer
      this.renderer = new Renderer({
        dpr: this.dpr,
        antialias: true,
        alpha: true,
      });

      const gl = this.renderer.gl;
      gl.clearColor(0.05, 0.05, 0.05, 1);
      this.container.appendChild(gl.canvas);
      this.resize();

      // Create camera
      this.camera = new Camera(this.renderer, {
        fov: 45,
        aspect: this.renderer.width / this.renderer.height,
        near: 0.1,
        far: 100,
      });
      this.camera.position.z = 2;

      // Create scene
      this.scene = new Transform();

      // Create silk shader program
      const program = new Program(gl, {
        vertex: this.getVertexShader(),
        fragment: this.getFragmentShader(),
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [this.renderer.width, this.renderer.height] },
        },
      });

      // Create plane geometry
      this.mesh = new Plane(gl, {
        width: 2,
        height: 2,
      });

      this.mesh.program = program;
      this.mesh.setParent(this.scene);

      // Handle resize
      window.addEventListener("resize", () => this.resize());

      // Start animation loop
      this.animate();
    } catch (error) {
      console.error("Error initializing OGL silk shader:", error);
      this.setupFallback();
    }
  }

  getVertexShader() {
    return `
      precision highp float;

      attribute vec3 position;
      attribute vec2 uv;

      uniform mat4 uModelMatrix;
      uniform mat4 uViewMatrix;
      uniform mat4 uProjectionMatrix;

      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(position, 1.0);
      }
    `;
  }

  getFragmentShader() {
    return `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;

      varying vec2 vUv;

      // Simplex-like noise function
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float n = mix(
          mix(
            mix(sin(dot(i + vec3(0, 0, 0), vec3(12.9898, 78.233, 45.164))) * 43758.5453, 
                sin(dot(i + vec3(1, 0, 0), vec3(12.9898, 78.233, 45.164))) * 43758.5453, f.x),
            mix(sin(dot(i + vec3(0, 1, 0), vec3(12.9898, 78.233, 45.164))) * 43758.5453, 
                sin(dot(i + vec3(1, 1, 0), vec3(12.9898, 78.233, 45.164))) * 43758.5453, f.x), f.y),
          mix(
            mix(sin(dot(i + vec3(0, 0, 1), vec3(12.9898, 78.233, 45.164))) * 43758.5453, 
                sin(dot(i + vec3(1, 0, 1), vec3(12.9898, 78.233, 45.164))) * 43758.5453, f.x),
            mix(sin(dot(i + vec3(0, 1, 1), vec3(12.9898, 78.233, 45.164))) * 43758.5453, 
                sin(dot(i + vec3(1, 1, 1), vec3(12.9898, 78.233, 45.164))) * 43758.5453, f.x), f.y), f.z);
        
        return fract(sin(n) * 43758.5453);
      }

      // Fractional Brownian Motion for organic cloth-like motion
      float fbm(vec3 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for (int i = 0; i < 4; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }

      void main() {
        vec2 uv = vUv;
        
        // Slow flowing cloth-like motion
        vec3 p = vec3(uv * 2.0, uTime * 0.15);
        
        // Multiple layers of noise for organic silk effect
        float silk = fbm(p);
        float silk2 = fbm(p + vec3(10.0, 20.0, 0.0));
        float silk3 = fbm(p * 0.5 + vec3(uTime * 0.1, 0.0, 0.0));
        
        // Combine layers with smooth blending
        float pattern = mix(silk, silk2, sin(uTime * 0.3) * 0.5 + 0.5);
        pattern = mix(pattern, silk3, 0.3);
        
        // Dark charcoal base
        vec3 darkBase = vec3(0.08, 0.08, 0.1);
        
        // Warm amber/orange highlights
        vec3 warmHighlight = vec3(1.0, 0.6, 0.2);
        
        // Create flowing highlights based on pattern
        float highlight = pow(pattern, 2.0) * 0.6;
        
        // Blend base with highlights
        vec3 color = mix(darkBase, warmHighlight, highlight * 0.5);
        
        // Add subtle secondary highlights
        float secondaryHighlight = sin(pattern * 3.14159 + uTime * 0.2) * 0.5 + 0.5;
        color = mix(color, vec3(1.0, 0.7, 0.3), secondaryHighlight * 0.15);
        
        // Film grain effect
        float grain = fract(sin(dot(uv + uTime * 0.5, vec2(12.9898, 78.233))) * 43758.5453);
        grain = mix(grain, 0.5, 0.85); // Reduce grain intensity
        color *= mix(1.0, grain, 0.08);
        
        // Soft vignette edges
        vec2 vignetteUv = vUv - 0.5;
        float vignette = 1.0 - length(vignetteUv) * 0.8;
        vignette = smoothstep(0.0, 1.0, vignette);
        color *= mix(0.7, 1.0, vignette);
        
        // Cinematic lighting - subtle radial falloff
        float radial = length(uv - 0.5) * 1.2;
        color *= mix(1.0, 0.85, radial * radial);
        
        gl_FragColor = vec4(color, 1.0);
      }
    `;
  }

  animate() {
    this.time += 0.016; // ~60fps
    
    if (this.mesh && this.mesh.program) {
      this.mesh.program.uniforms.uTime.value = this.time;
    }
    
    if (this.renderer) {
      this.renderer.render({
        scene: this.scene,
        camera: this.camera,
      });
    }
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }

  resize() {
    if (!this.renderer) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.renderer.setSize(width, height);
    
    if (this.camera) {
      this.camera.perspective({
        aspect: width / height,
      });
    }
    
    if (this.mesh && this.mesh.program) {
      this.mesh.program.uniforms.uResolution.value = [width, height];
    }
  }

  setupFallback() {
    // Fallback: CSS gradient animation
    this.container.style.background = "linear-gradient(135deg, #0d0d0f 0%, #1a1a1f 25%, #2a1810 50%, #1a1a1f 75%, #0d0d0f 100%)";
    this.container.style.backgroundSize = "400% 400%";
    this.container.style.animation = "gradientShift 20s ease infinite";
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas) {
      this.renderer.gl.canvas.remove();
    }
    window.removeEventListener("resize", () => this.resize());
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
    this.fetchStats().then(callback);
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
    
    document.querySelectorAll('.section, .card, .reward-tier, .faq-item, .timeline-item').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      this.observer.observe(el);
    });
    
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
    
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }
}

// ============================================================
// INITIALIZATION
// ============================================================

let silkShader = null;

document.addEventListener("DOMContentLoaded", () => {
  // Show loading screen
  showLoading();
  
  // Initialize silk shader
  setTimeout(() => {
    const container = document.getElementById("shader-gradient-container");
    if (container) {
      silkShader = new SilkShader(container);
    }
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
    if (silkShader) {
      silkShader.destroy();
    }
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
