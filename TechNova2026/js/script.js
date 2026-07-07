/* TechNova 2026 — shared front-end behaviour
   Every block checks the DOM before running so this one file can be
   included, unmodified, on every page. */

document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initCountdown();
  initDayTabs();
  initGallery();
  initFaq();
  initRegisterForm();
  initContactForm();
  markCurrentNavLink();
  loadBuildInfo();
});

/* ---------- mobile nav ---------- */
function initNavToggle() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

/* ---------- highlight current page in nav ---------- */
function markCurrentNavLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'page');
  });
}

/* ---------- countdown to the symposium ---------- */
function initCountdown() {
  const el = document.querySelector('.countdown');
  if (!el) return;
  const target = new Date(el.dataset.target || '2026-10-16T09:00:00');

  const days = el.querySelector('[data-unit="days"] .num');
  const hours = el.querySelector('[data-unit="hours"] .num');
  const mins = el.querySelector('[data-unit="mins"] .num');
  const secs = el.querySelector('[data-unit="secs"] .num');

  function tick() {
    const diff = Math.max(0, target - new Date());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (days) days.textContent = String(d).padStart(2, '0');
    if (hours) hours.textContent = String(h).padStart(2, '0');
    if (mins) mins.textContent = String(m).padStart(2, '0');
    if (secs) secs.textContent = String(s).padStart(2, '0');
  }
  tick();
  setInterval(tick, 1000);
}

/* ---------- schedule day tabs ---------- */
function initDayTabs() {
  const tabs = document.querySelectorAll('.day-tab');
  if (!tabs.length) return;
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.day-schedule').forEach(d => d.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.day);
      if (target) target.classList.add('active');
    });
  });
}

/* ---------- gallery lightbox ---------- */
function initGallery() {
  const items = document.querySelectorAll('.gallery-item');
  const lightbox = document.querySelector('.lightbox');
  if (!items.length || !lightbox) return;
  const inner = lightbox.querySelector('.lightbox-inner');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  items.forEach(item => {
    item.addEventListener('click', () => {
      inner.innerHTML = item.querySelector('svg').outerHTML +
        `<p style="font-family:var(--font-mono);font-size:0.8rem;margin-top:14px;color:var(--ink-dim);">${item.dataset.caption || ''}</p>`;
      lightbox.classList.add('open');
    });
  });
  closeBtn?.addEventListener('click', () => lightbox.classList.remove('open'));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('open'); });
}

/* ---------- FAQ accordion ---------- */
function initFaq() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    q?.addEventListener('click', () => {
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

/* ---------- generic validation helper ---------- */
function validateField(field, condition, message) {
  const errorEl = field.querySelector('.field-error');
  if (!condition) {
    field.classList.add('invalid');
    if (errorEl) errorEl.textContent = message;
    return false;
  }
  field.classList.remove('invalid');
  return true;
}

/* ---------- registration form ---------- */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;
  const success = document.querySelector('.form-success');

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    const name = form.querySelector('#reg-name');
    valid = validateField(name.closest('.field'), name.value.trim().length > 1, 'Enter your full name.') && valid;

    const email = form.querySelector('#reg-email');
    valid = validateField(email.closest('.field'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value), 'Enter a valid email address.') && valid;

    const college = form.querySelector('#reg-college');
    valid = validateField(college.closest('.field'), college.value.trim().length > 1, 'Enter your college or organisation.') && valid;

    const phone = form.querySelector('#reg-phone');
    valid = validateField(phone.closest('.field'), /^[0-9+\-\s]{7,15}$/.test(phone.value), 'Enter a valid phone number.') && valid;

    const track = form.querySelector('#reg-track');
    valid = validateField(track.closest('.field'), track.value !== '', 'Choose an event track.') && valid;

    if (!valid) return;

    form.reset();
    form.style.display = 'none';
    if (success) success.classList.add('show');
  });
}

/* ---------- contact form ---------- */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const success = document.querySelector('.form-success');

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;

    const name = form.querySelector('#c-name');
    valid = validateField(name.closest('.field'), name.value.trim().length > 1, 'Enter your name.') && valid;

    const email = form.querySelector('#c-email');
    valid = validateField(email.closest('.field'), /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value), 'Enter a valid email address.') && valid;

    const message = form.querySelector('#c-message');
    valid = validateField(message.closest('.field'), message.value.trim().length > 5, 'Message is too short.') && valid;

    if (!valid) return;

    form.reset();
    form.style.display = 'none';
    if (success) success.classList.add('show');
  });
}

/* ---------- DevOps touch: read build metadata baked in at container build
   time (see Dockerfile) and show it quietly in the footer. Fails silently
   if the file isn't present, e.g. when opening the HTML straight from disk. */
function loadBuildInfo() {
  const badge = document.querySelector('.build-badge');
  if (!badge) return;
  fetch('build-info.json', { cache: 'no-store' })
    .then(r => (r.ok ? r.json() : Promise.reject()))
    .then(data => {
      badge.textContent = `build ${data.version || 'dev'} · ${data.builtAt || ''} · pod ${data.hostname || 'local'}`;
    })
    .catch(() => {
      badge.textContent = 'build dev · local';
    });
}
