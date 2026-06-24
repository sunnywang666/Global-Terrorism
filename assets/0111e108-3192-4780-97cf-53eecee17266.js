// ============================================================
// Particle Background + Scroll Engine
// ============================================================

// --- Falling Ember Particles ---
class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.maxParticles = 60;
    this.running = true;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.init();
    this.animate();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  init() {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomY) {
    const colors = [
      'rgba(194,48,40,', 'rgba(212,165,74,', 'rgba(232,93,74,',
      'rgba(138,141,147,', 'rgba(74,127,181,'
    ];
    const c = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 2.5 + 0.5;
    return {
      x: Math.random() * this.canvas.width,
      y: randomY ? Math.random() * this.canvas.height : -10,
      size,
      speedY: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      color: c,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005
    };
  }

  animate() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((p, i) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.pulse += p.pulseSpeed;
      const flickerOpacity = p.opacity * (0.7 + 0.3 * Math.sin(p.pulse));

      // Glow effect
      const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
      gradient.addColorStop(0, p.color + flickerOpacity + ')');
      gradient.addColorStop(0.4, p.color + (flickerOpacity * 0.4) + ')');
      gradient.addColorStop(1, p.color + '0)');

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Core
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + flickerOpacity + ')';
      this.ctx.fill();

      if (p.y > this.canvas.height + 10 || p.x < -10 || p.x > this.canvas.width + 10) {
        this.particles[i] = this.createParticle(false);
      }
    });

    requestAnimationFrame(() => this.animate());
  }
}

// --- Sticky Scrollytelling Engine ---
class ScrollEngine {
  constructor() {
    this.sections = [];
    this.progressBar = document.getElementById('scroll-progress');
    this.sectionIndicator = document.getElementById('section-indicator');
    this.setupProgress();
    this.setupFadeIns();
    this.setupStickySections();
  }

  setupProgress() {
    window.addEventListener('scroll', () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrollTop / docHeight, 1);
      if (this.progressBar) {
        this.progressBar.style.transform = `scaleX(${progress})`;
      }
    });
  }

  setupFadeIns() {
    const els = document.querySelectorAll('.reveal');
    // Determine delay class
    function getDelay(el) {
      if (el.classList.contains('delay-3')) return 450;
      if (el.classList.contains('delay-2')) return 300;
      if (el.classList.contains('delay-1')) return 150;
      return 0;
    }

    // Hide below-fold elements immediately via JS
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top > window.innerHeight * 0.85) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(50px)';
        el.dataset.hidden = '1';
      }
      // Above-fold: already visible, no action needed
    });

    // Animate function using rAF
    function animateIn(el) {
      if (el.dataset.animated) return;
      el.dataset.animated = '1';
      const delay = getDelay(el);
      setTimeout(() => {
        const duration = 800;
        const start = performance.now();
        const startY = 50;
        function frame(now) {
          const t = Math.min((now - start) / duration, 1);
          // cubic-bezier approximation
          const ease = 1 - Math.pow(1 - t, 3);
          el.style.opacity = String(ease);
          el.style.transform = 'translateY(' + (startY * (1 - ease)) + 'px)';
          if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }, delay);
    }

    // Observer for below-fold
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target.dataset.hidden === '1') {
          animateIn(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

    els.forEach(el => {
      if (el.dataset.hidden === '1') observer.observe(el);
    });

    // Safety fallback
    setTimeout(() => {
      els.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    }, 3000);
  }

  setupStickySections() {
    document.querySelectorAll('.story-step').forEach(step => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const stateId = entry.target.dataset.state;
            const sectionEl = entry.target.closest('.story-section');
            if (sectionEl && stateId) {
              // light up the active step, dim the ones scrolled past
              sectionEl.querySelectorAll('.story-step').forEach(s => {
                s.classList.toggle('is-active', s === entry.target);
              });
              const event = new CustomEvent('storystate', { detail: { state: stateId, section: sectionEl.id } });
              window.dispatchEvent(event);
            }
            // Update section indicator
            const chapterNum = entry.target.closest('[data-chapter]');
            if (chapterNum && this.sectionIndicator) {
              this.sectionIndicator.textContent = chapterNum.dataset.chapter;
            }
          }
        });
      }, { threshold: 0.6 });
      observer.observe(step);
    });
  }
}

// --- Number Counter Animation ---
function animateValue(el, target, duration, suffix) {
  if (el.dataset.animated) return;
  el.dataset.animated = '1';
  const start = performance.now();
  suffix = suffix || '';
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(target * eased).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function setupCounters() {
  const els = document.querySelectorAll('.counter');

  function triggerCounter(el) {
    const target = parseInt(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    animateValue(el, target, 2200, suffix);
  }

  // Immediately check viewport
  els.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      triggerCounter(el);
    }
  });

  // Observer for below-fold counters
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) triggerCounter(entry.target);
    });
  }, { threshold: 0.2 });
  els.forEach(el => { if (!el.dataset.animated) observer.observe(el); });

  // Safety fallback
  setTimeout(() => {
    els.forEach(el => {
      if (!el.dataset.animated) {
        el.dataset.animated = '1';
        el.textContent = parseInt(el.dataset.target).toLocaleString();
      }
    });
  }, 3000);
}

// --- Staggered Reveal for Children ---
function setupStaggerReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.staggered) {
        entry.target.dataset.staggered = '1';
        const children = entry.target.querySelectorAll('.stagger-child');
        children.forEach((child, i) => {
          // Start hidden
          child.style.opacity = '0';
          child.style.transform = 'scale(0.5)';
          // Animate in row by row
          const rowDelay = Math.floor(i / 32) * 60 + (i % 32) * 5;
          setTimeout(() => {
            const duration = 300;
            const start = performance.now();
            function frame(now) {
              const t = Math.min((now - start) / duration, 1);
              const ease = 1 - Math.pow(1 - t, 3);
              child.style.opacity = String(ease);
              child.style.transform = 'scale(' + (0.5 + 0.5 * ease) + ')';
              if (t < 1) requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
          }, rowDelay);
        });
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.stagger-parent').forEach(el => observer.observe(el));

  // Safety: make all icons visible after timeout
  setTimeout(() => {
    document.querySelectorAll('.stagger-child').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'scale(1)';
    });
  }, 5000);
}
