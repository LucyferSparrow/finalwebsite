/* ============================================
   JYOTISH VEDA — Main JavaScript
   Particles, Animations, Blog CRUD, Forms
   ============================================ */

// ── Default Courses ──
const defaultCourses = [
  {
    id: 'course-1',
    title: 'Vedic Astrology for Beginners: The 9 Grahas',
    level: 'beginner',
    author: 'Pandit Shastri',
    date: '2026-03-05',
    image: '',
    content: `A comprehensive introduction to the foundational building blocks of Jyotish — the Navagrahas (Nine Planets).\n\nIn this course, you will learn the unique significations, karakas, and mythological origins of the Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu. Ideal for those taking their first step into Vedic Astrology.`,
    icon: '🌞'
  },
  {
    id: 'course-2',
    title: 'Understanding the 12 Bhavas (Houses)',
    level: 'beginner',
    author: 'Dr. Meera Joshi',
    date: '2026-03-01',
    image: '',
    content: `Discover the 12 Bhavas of the Vedic Birth Chart. Each house governs specific areas of life from health, wealth, and family to marriage, career, and spiritual liberation (Moksha).\n\nLearn how to map the sky and interpret the basic structure of a Janam Kundli.`,
    icon: '🏠'
  },
  {
    id: 'course-3',
    title: 'The Interplay of Yogas & Doshas',
    level: 'intermediate',
    author: 'Acharya Vinod',
    date: '2026-02-28',
    image: '',
    content: `Move beyond basic planetary placements and explore the complex planetary combinations (Yogas) that shape human destiny.\n\nWe will cover auspicious yogas like Raja Yoga and Dhana Yoga, as well as challenging doshas like Mangal Dosha and Kemadruma Dosha, along with their traditional remedies.`,
    icon: '✨'
  },
  {
    id: 'course-4',
    title: 'Panchanga & Muhurta: The DNA of Time',
    level: 'intermediate',
    author: 'Ratna Sharma',
    date: '2026-02-20',
    image: '',
    content: `Learn the art of Electional Astrology. Understand the 5 limbs of time (Panchanga): Tithi, Vara, Nakshatra, Yoga, and Karana.\n\nThis intermediate course teaches you how to select auspicious timings for marriage, business launches, and important life events based on planetary alignments.`,
    icon: '⏳'
  },
  {
    id: 'course-5',
    title: 'Vimshottari Dasha System Masterclass',
    level: 'expert',
    author: 'Pandit Shastri',
    date: '2026-02-15',
    image: '',
    content: `Master the premier predictive tool in Vedic Astrology — the 120-year Vimshottari Dasha system.\n\nLearn how to calculate, interpret, and predict the timing of significant life events by analyzing Mahadashas, Antardashas, and Pratyantar dashas in correlation with planetary transits (Gochara).`,
    icon: '🕰️'
  },
  {
    id: 'course-6',
    title: 'Prashna Shastra: Horary Astrology',
    level: 'expert',
    author: 'Dr. Meera Joshi',
    date: '2026-02-10',
    image: '',
    content: `An advanced exploration of Prashna Shastra — answering specific questions based on the exact time the question is asked, without needing a birth chart.\n\nWe cover Tajika aspects, the role of the ascending degree, and specific rules for predicting success, failure, theft, illness, and travel.`,
    icon: '❓'
  }
];

// ── Initialize App ──
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavbar();
  initScrollReveal();
  await fetchCoursesFromAPI();
  initCourseSystem();
  initLevelsPage();
  initCourseViewer();
  initConsultationForm();
  initScrollTop();
  initNewsletterForm();
});

// ── Particle Canvas Background ──
function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouse = { x: null, y: null };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.4;
      this.speedY = (Math.random() - 0.5) * 0.4;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
      this.pulseSpeed = Math.random() * 0.02 + 0.005;

      const colors = [
        '216, 180, 254',  // lavender
        '240, 171, 252',  // pink
        '251, 196, 171',  // peach
        '167, 243, 208',  // mint
        '186, 230, 253',  // sky
        '249, 168, 212',  // rose
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += this.pulseSpeed;

      // Mouse interaction
      if (mouse.x !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          this.x -= dx * 0.008;
          this.y -= dy * 0.008;
        }
      }

      // Wrap around
      if (this.x < -10) this.x = canvas.width + 10;
      if (this.x > canvas.width + 10) this.x = -10;
      if (this.y < -10) this.y = canvas.height + 10;
      if (this.y > canvas.height + 10) this.y = -10;
    }

    draw() {
      const currentOpacity = this.opacity * (0.7 + 0.3 * Math.sin(this.pulse));
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${currentOpacity})`;
      ctx.fill();

      // Glow effect
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${currentOpacity * 0.15})`;
      ctx.fill();
    }
  }

  // Create particles
  const count = Math.min(120, Math.floor((canvas.width * canvas.height) / 12000));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  // Draw connections between close particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const opacity = (1 - dist / 150) * 0.08;
          ctx.strokeStyle = `rgba(216, 180, 254, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    drawConnections();
    requestAnimationFrame(animate);
  }

  animate();
}

// ── Navbar ──
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Scroll effect
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });

  // Mobile toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
}

// ── Scroll Reveal ──
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// ── Courses System ──
function initCourseSystem() {
  const grid = document.getElementById('courses-grid');
  // Removed internal filter init since levels.html uses strict URL param filtering
}

function initLevelsPage() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const levelId = urlParams.get('level') || 'beginner';

  // Highlight title dynamically
  const titleElem = document.getElementById('levels-page-title');
  if (titleElem) {
    titleElem.innerHTML = `<span class="highlight">${levelId.charAt(0).toUpperCase() + levelId.slice(1)}</span> Courses`;
  }

  loadCourses(levelId);
}

function getAllCourses() {
  const dbCourses = window._coursesFromDB || [];
  // Merge: DB courses first, then defaults that aren't already in DB
  const dbIds = new Set(dbCourses.map(c => c.id));
  const merged = [...dbCourses, ...defaultCourses.filter(c => !dbIds.has(c.id))];
  return merged;
}

async function fetchCoursesFromAPI() {
  try {
    const res = await fetch('/api/courses');
    const data = await res.json();
    if (data.courses) {
      window._coursesFromDB = data.courses;
    }
  } catch (e) {
    // API unavailable, defaults will be used
  }
}

function loadCourses(filter = 'all') {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;

  const courses = getAllCourses();
  const filtered = filter === 'all' ? courses : courses.filter(p => p.level === filter);

  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 16px;">🔭</div>
        <p>No courses found for this level yet.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((course, index) => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.style.animationDelay = `${index * 0.1}s`;
    card.setAttribute('data-level', course.level);

    const imageHTML = course.image
      ? `<img src="${course.image}" alt="${course.title}" onerror="this.parentElement.innerHTML='<div class=\\'placeholder-icon\\'>${course.icon || '✨'}</div>'" />`
      : `<div class="placeholder-icon">${course.icon || '✨'}</div>`;

    card.innerHTML = `
      <div class="course-card-image">${imageHTML}</div>
      <div class="course-card-body">
        <div class="course-card-meta">
          <span class="course-level">${course.level}</span>
        </div>
        <h3>${course.title}</h3>
        <p>${course.content.substring(0, 120)}...</p>
        <span class="course-read-more">View Syllabus →</span>
      </div>
    `;

    card.addEventListener('click', () => window.location.href = 'course-view.html?id=' + course.id);
    grid.appendChild(card);
  });

  // Animate cards in
  grid.querySelectorAll('.course-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 100);
  });
}

function initCourseFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadCourses(btn.dataset.filter);
    });
  });
}

// ── Course Viewer (Single Page) ──
function initCourseViewer() {
  const viewerTitle = document.getElementById('viewer-title');
  if (!viewerTitle) return; // Only run on course-view.html

  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('id');
  if (!courseId) {
    viewerTitle.textContent = "Course Not Found";
    return;
  }

  function renderViewer() {
    const courses = getAllCourses();
    const course = courses.find(c => c.id === courseId);

    if (!course) {
      viewerTitle.textContent = "Course Not Found";
      return;
    }

    const viewerImage = document.getElementById('viewer-image');
    const viewerLevel = document.getElementById('viewer-level');
    const viewerAuthor = document.getElementById('viewer-author');
    const viewerContent = document.getElementById('viewer-content');

  // Fill content
  if (course.image) {
    viewerImage.innerHTML = `<img src="${course.image}" alt="${course.title}" />`;
  } else {
    viewerImage.innerHTML = `<div class="viewer-placeholder-img">${course.icon || '✨'}</div>`;
  }

  viewerLevel.textContent = (course.level || '').toUpperCase();
  viewerTitle.textContent = course.title;

  const dateFormatted = new Date(course.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  viewerAuthor.textContent = `${dateFormatted} • By ${course.author || 'Anonymous'}`;
  viewerContent.textContent = course.content;
  }

  // API data already loaded before init, render once
  renderViewer();
}

// ── Consultation Form ──
function initConsultationForm() {
  const form = document.getElementById('consultation-form');
  const success = document.getElementById('consultation-success');

  // Form may not exist on admin page
  if (!form) return;

  // Set min date to today
  const dateInput = document.getElementById('consult-date');
  const today = new Date().toISOString().split('T')[0];
  dateInput.setAttribute('min', today);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
      name: document.getElementById('consult-name').value,
      email: document.getElementById('consult-email').value,
      date: document.getElementById('consult-date').value,
      type: document.getElementById('consult-type').value,
      birth: document.getElementById('consult-birth').value,
      message: document.getElementById('consult-message').value,
    };

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Server error');

      // Show success
      form.style.display = 'none';
      success.classList.add('show');

      // Reset after some time
      setTimeout(() => {
        form.reset();
        form.style.display = '';
        success.classList.remove('show');
      }, 5000);
    } catch (err) {
      alert('Failed to book consultation. Please try again.');
    }
  });
}

// ── Scroll to Top ──
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── Newsletter Form ──
function initNewsletterForm() {
  const form = document.getElementById('newsletter-form');
  // Form may not exist on admin page
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input').value;

    const subs = JSON.parse(localStorage.getItem('jyotish-newsletter') || '[]');
    subs.push({ email, date: new Date().toISOString() });
    localStorage.setItem('jyotish-newsletter', JSON.stringify(subs));

    form.querySelector('input').value = '';
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = '✓ Subscribed!';
    btn.style.background = 'linear-gradient(135deg, #22c55e, #a7f3d0)';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 3000);
  });
}
