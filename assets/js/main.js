'use strict';

/* ============================================================
   CITY STAY TIBERIAS — Main JS v2
   ============================================================ */

// === Navbar ===
const navbar = document.getElementById('navbar') || document.querySelector('.navbar');
if (navbar) {
  const onScroll = () => {
    const scrolled = window.scrollY > 80;
    navbar.classList.toggle('scrolled', scrolled);
    navbar.classList.toggle('transparent', !scrolled);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // Run immediately — critical for correct initial state
  onScroll();
  // Also run after fonts/images load in case of reflow
  window.addEventListener('load', onScroll);
}

// === Mobile Menu ===
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const mobileClose = document.querySelector('.mobile-close');

function openMenu() {
  mobileMenu?.classList.add('open');
  hamburger?.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}
function closeMenu() {
  mobileMenu?.classList.remove('open');
  hamburger?.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', openMenu);
mobileClose?.addEventListener('click', closeMenu);
mobileMenu?.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', closeMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

// === Back to Top ===
const backTop = document.getElementById('back-top') || document.querySelector('.back-top');
if (backTop) {
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// === Scroll Reveal ===
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// === Language Switch ===
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    const path = window.location.pathname;
    if (lang === 'en' && !path.startsWith('/en')) {
      window.location.href = '/en' + (path === '/' ? '/' : path);
    } else if (lang === 'he' && path.startsWith('/en')) {
      window.location.href = path.replace(/^\/en/, '') || '/';
    }
  });
});

// === WuBook ZakNeb Loader ===
function initWuBook(containerId) {
  if (typeof ZakNebIframe === 'undefined') return;
  const url = 'https://wubook.net/nneb/bk?f=today&n=1&ep=52ae8af2&o=1.0.0.0';
  const Neb = new ZakNebIframe('#' + containerId, url);
  Neb.render();
}

const wbEl = document.getElementById('_wbord_');
if (wbEl) {
  // Try immediately, then on load
  if (typeof ZakNebIframe !== 'undefined') {
    initWuBook('_wbord_');
  } else {
    window.addEventListener('load', () => initWuBook('_wbord_'));
  }
}

// === GA4 Tracking ===
function track(event, params = {}) {
  if (typeof gtag !== 'undefined') gtag('event', event, params);
}

document.querySelectorAll('[data-cta]').forEach(el => {
  el.addEventListener('click', () => track('cta_click', { label: el.dataset.cta, page: location.pathname }));
});

document.querySelectorAll('a[href^="tel:"]').forEach(el => {
  el.addEventListener('click', () => track('phone_call', { phone: el.href.replace('tel:', '') }));
});

document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
  el.addEventListener('click', () => track('whatsapp_click', { source: el.dataset.cta || 'unknown' }));
});

// Scroll depth
const milestones = [25, 50, 75, 100];
const reached = new Set();
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)) * 100;
  milestones.forEach(m => {
    if (pct >= m && !reached.has(m)) { reached.add(m); track('scroll_depth', { depth: m }); }
  });
}, { passive: true });

// === Lightbox ===
const lb = document.getElementById('lightbox');
if (lb) {
  const lbImg = lb.querySelector('img');
  const lbClose = lb.querySelector('.lb-close');

  function openLightbox(src, alt) {
    lbImg.src = src; lbImg.alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }

  lbClose?.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && lb.classList.contains('open')) closeLightbox(); });

  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      if (img) openLightbox(img.src, img.alt);
    });
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });
  });
}

// === VAT Display ===
const VAT = 1.18;
document.querySelectorAll('[data-base-price]').forEach(el => {
  const base = parseFloat(el.dataset.basePrice);
  if (!isNaN(base)) el.textContent = Math.ceil(base * VAT).toLocaleString('he-IL');
});

// === Club Form ===
const clubForm = document.getElementById('club-form');
if (clubForm) {
  let lastSubmit = 0;
  clubForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (clubForm.querySelector('[name="website"]')?.value) return;
    if (Date.now() - lastSubmit < 10000) return showAlert('error', 'אנא המתן לפני שליחה חוזרת');

    const btn = clubForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'שולח...';

    const data = Object.fromEntries(new FormData(clubForm).entries());
    delete data.website;

    try {
      const cfg = window.CITYSTAY_CONFIG || {};
      if (!cfg.supabaseUrl || cfg.supabaseUrl.includes('YOUR_PROJECT')) throw new Error('not configured');

      const res = await fetch(`${cfg.supabaseUrl}/rest/v1/club_members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': cfg.supabaseAnonKey,
          'Authorization': `Bearer ${cfg.supabaseAnonKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          full_name: data.full_name, phone: data.phone, email: data.email,
          birthday: data.birthday || null, anniversary: data.anniversary || null,
          city: data.city || null, source: 'website_form',
          created_at: new Date().toISOString()
        })
      });

      if (res.ok || res.status === 201) {
        lastSubmit = Date.now();
        showAlert('success', '🎉 נרשמת בהצלחה למועדון! נשלח אליך מבצעים בקרוב.');
        clubForm.reset();
        track('club_signup');
      } else throw new Error(res.status);
    } catch (err) {
      showAlert('error', 'אירעה שגיאה. נסה שנית או צור קשר: 04-6206464');
    }

    btn.disabled = false; btn.textContent = btn.dataset.defaultText || orig;
  });

  function showAlert(type, msg) {
    let el = clubForm.querySelector('.alert');
    if (!el) { el = document.createElement('div'); el.className = 'alert'; clubForm.appendChild(el); }
    el.className = `alert alert-${type} show`;
    el.textContent = msg;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success') setTimeout(() => el.classList.remove('show'), 7000);
  }
}

// === Contact Form ===
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  let lastSubmit = 0;
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (contactForm.querySelector('[name="website"]')?.value) return;
    if (Date.now() - lastSubmit < 8000) return;

    const btn = contactForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.disabled = true; btn.textContent = 'שולח...';

    const data = Object.fromEntries(new FormData(contactForm).entries());

    try {
      const res = await fetch('https://formspree.io/f/mrejvvaw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      });
      const alertEl = contactForm.querySelector('.alert') || document.getElementById('contact-alert');
      if (res.ok) {
        lastSubmit = Date.now();
        if (alertEl) { alertEl.className = 'alert alert-success show'; alertEl.textContent = '✅ הודעתך נשלחה! נחזור אליך בהקדם.'; }
        contactForm.reset();
        track('contact_form_submit', { subject: data.subject });
      } else throw new Error();
    } catch {
      const alertEl = contactForm.querySelector('.alert') || document.getElementById('contact-alert');
      if (alertEl) { alertEl.className = 'alert alert-error show'; alertEl.textContent = 'שגיאה בשליחה. אנא נסה שנית או התקשר: 04-6206464'; }
    }

    btn.disabled = false; btn.textContent = orig;
  });
}

// === Pre-fill contact subject from URL ===
const urlSubject = new URLSearchParams(location.search).get('subject');
if (urlSubject) {
  const sel = document.getElementById('contact_subject');
  if (sel) { for (const o of sel.options) { if (o.value === urlSubject) { o.selected = true; break; } } }
}
