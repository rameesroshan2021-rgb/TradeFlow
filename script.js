// --- Hamburger Menu ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));

// --- Close menu on link click (mobile) ---
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// --- Smooth Scroll for Anchor Links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// --- Scroll Animations (Intersection Observer) ---
const reveals = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

reveals.forEach(el => observer.observe(el));

// --- Horizontal Scroll (Drag to Scroll) ---
const scrollContainer = document.getElementById('productScroll');
let isDown = false;
let startX;
let scrollLeftPos;

scrollContainer.addEventListener('mousedown', (e) => {
  isDown = true;
  scrollContainer.style.cursor = 'grabbing';
  startX = e.pageX - scrollContainer.offsetLeft;
  scrollLeftPos = scrollContainer.scrollLeft;
});

scrollContainer.addEventListener('mouseleave', () => {
  isDown = false;
  scrollContainer.style.cursor = 'grab';
});

scrollContainer.addEventListener('mouseup', () => {
  isDown = false;
  scrollContainer.style.cursor = 'grab';
});

scrollContainer.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - scrollContainer.offsetLeft;
  const walk = (x - startX) * 1.5;
  scrollContainer.scrollLeft = scrollLeftPos - walk;
});

// --- Contact Form ---
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  alert('Thank you for your inquiry. Our creative team will respond within 24 hours.');
  this.reset();
});

// --- Active Nav Link Highlight on Scroll ---
const sections = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navAnchors.forEach(a => {
    a.classList.remove('active');
    if (a.getAttribute('href') === '#' + current) {
      a.classList.add('active');
    }
  });
});
