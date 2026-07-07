/**
 * campaign.js - FundVerse Campaign Page
 * 
 * Features:
 * - WebGL-based animated gradient hero (ShaderGradient-inspired)
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
// SHADER GRADIENT HERO
// ============================================================

class ShaderGradient {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { antialias: true, alpha: true });
    
    if (!this.gl) {
      console.warn('WebGL not supported, using fallback gradient');
      this.useFallback = true;
      this.setupFallback();
      return;
    }
    
    this.useFallback = false;
    this.time = 0;
    this.animationId = null;
    
    this.setupShaders();
    this.setupBuffers();
    this.resizeCanvas();
    this.animate();
    
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  setupFallback() {
    // Fallback: CSS gradient animation
    this.canvas.style.background = `
      linear-gradient(135deg, 
        #ff5005 0%, 
        #dbba95 25%, 
        #ff5005 50%, 
        #ff7a3d 75%, 
        #ff5005 100%)
    `;
    this.canvas.style.backgroundSize = '400% 400%';
    this.canvas.style.animation = 'gradientShift 15s ease infinite';
  }
  
  setupShaders() {
    const vertexShader = `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision highp float;
      uniform float time;
      uniform vec2 resolution;
      
      // Organic noise function
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
      
      void main() {
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        
        // Create flowing, organic movement
        float n1 = noise(vec3(uv * 2.0, time * 0.3));
        float n2 = noise(vec3(uv * 3.0 + vec3(10.0), time * 0.25));
        float n3 = noise(vec3(uv * 1.5 - vec3(5.0), time * 0.2));
        
        // Combine noise for organic effect
        float blend = sin(time * 0.5) * 0.5 + 0.5;
        float pattern = mix(n1, mix(n2, n3, blend), 0.5);
        
        // Color palette inspired by the reference gradient
        vec3 color1 = vec3(1.0, 0.31, 0.02); // #ff5005
        vec3 color2 = vec3(0.86, 0.73, 0.58); // #dbba95
        vec3 color3 = vec3(1.0, 0.48, 0.24); // #ff7a3d
        
        // Mix colors based on pattern and position
        vec3 finalColor = mix(color1, color2, pattern);
        finalColor = mix(finalColor, color3, sin(uv.x * 3.0 + time * 0.4) * 0.5 + 0.5);
        
        // Add some radial variation
        float radial = length(uv - 0.5) * 1.5;
        finalColor = mix(finalColor, color1, sin(radial + time * 0.3) * 0.2 + 0.3);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
    
    this.program = this.createProgram(vertexShader, fragmentShader);
    this.gl.useProgram(this.program);
    
    this.timeUniform = this.gl.getUniformLocation(this.program, 'time');
    this.resolutionUniform = this.gl.getUniformLocation(this.program, 'resolution');
  }
  
  createProgram(vertexSrc, fragmentSrc) {
    const vertex = this.gl.createShader(this.gl.VERTEX_SHADER);
    this.gl.shaderSource(vertex, vertexSrc);
    this.gl.compileShader(vertex);
    
    if (!this.gl.getShaderParameter(vertex, this.gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', this.gl.getShaderInfoLog(vertex));
    }
    
    const fragment = this.gl.createShader(this.gl.FRAGMENT_SHADER);
    this.gl.shaderSource(fragment, fragmentSrc);
    this.gl.compileShader(fragment);
    
    if (!this.gl.getShaderParameter(fragment, this.gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', this.gl.getShaderInfoLog(fragment));
    }
    
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Program link error:', this.gl.getProgramInfoLog(program));
    }
    
    return program;
  }
  
  setupBuffers() {
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);
    
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    
    const positionLocation = this.gl.getAttribLocation(this.program, 'position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.uniform2f(this.resolutionUniform, this.canvas.width, this.canvas.height);
  }
  
  animate() {
    this.time += 0.016; // ~60fps
    this.gl.uniform1f(this.timeUniform, this.time);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
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
    document.querySelectorAll('.section, .card, .allocation-item, .reward-tier, .faq-item, .timeline-item').forEach(el => {
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
    const navbar = document.getElementById('navbar');
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

document.addEventListener('DOMContentLoaded', () => {
  // Initialize shader gradient
  const canvas = document.getElementById('gradient-canvas');
  const gradient = new ShaderGradient(canvas);
  
  // Initialize live data manager
  const dataManager = new LiveDataManager();
  
  // Initialize UI elements
  const raisedElement = document.getElementById('stat-raised');
  const contributorsElement = document.getElementById('stat-contributors');
  const goalElement = document.getElementById('stat-goal');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
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
  document.getElementById('footer-year').textContent = new Date().getFullYear();
  
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
    gradient.destroy();
  });
});

// ============================================================
// FALLBACK GRADIENT ANIMATION
// ============================================================

// Add this to the document if WebGL fails
const style = document.createElement('style');
style.textContent = `
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;
document.head.appendChild(style);