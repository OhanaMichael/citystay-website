/* ================================================
   CITY STAY TIBERIAS — Main JavaScript
   ================================================ */

'use strict';

// === Navbar scroll behavior ===
const navbar = document.querySelector('.navbar');
if (navbar) {
  const handleScroll = () => {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
      navbar.classList.remove('transparent');
    } else {
      navbar.classList.remove('scrolled');
      navbar.classList.add('transparent');
    }
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

// === Mobile menu ===
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');
const mobileClose = document.querySelector('.mobile-close');

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });

  const closeMenu = () => {
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (mobileClose) mobileClose.addEventListener('click', closeMenu);

  mobileMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu();
  });
}

// === Back to top ===
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// === Scroll reveal ===
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// === Language switcher ===
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const lang = btn.dataset.lang;
    if (lang === 'en') {
      // Navigate to EN version
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/en')) {
        window.location.href = '/en' + (currentPath === '/' ? '/' : currentPath);
      }
    } else {
      // Navigate to HE version
      const currentPath = window.location.pathname;
      window.location.href = currentPath.replace(/^\/en/, '') || '/';
    }
  });
});

// === VAT Calculator (18%) ===
const VAT_RATE = 1.18;

function priceWithVAT(base) {
  return Math.ceil(base * VAT_RATE);
}

// Update all price displays with VAT
document.querySelectorAll('[data-base-price]').forEach(el => {
  const base = parseFloat(el.dataset.basePrice);
  if (!isNaN(base)) {
    el.textContent = priceWithVAT(base).toLocaleString('he-IL');
  }
});

// === CTA tracking (GA4) ===
function trackEvent(eventName, params = {}) {
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, params);
  }
}

document.querySelectorAll('[data-cta]').forEach(btn => {
  btn.addEventListener('click', () => {
    trackEvent('cta_click', {
      cta_label: btn.dataset.cta,
      page: window.location.pathname
    });
  });
});

document.querySelectorAll('a[href^="tel:"]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('phone_call', { phone: link.href.replace('tel:', '') });
  });
});

document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
  link.addEventListener('click', () => {
    trackEvent('whatsapp_click', { source: 'floating_button' });
  });
});

// === Scroll depth tracking ===
const scrollMilestones = [25, 50, 75, 100];
const reachedMilestones = new Set();
window.addEventListener('scroll', () => {
  const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
  scrollMilestones.forEach(m => {
    if (pct >= m && !reachedMilestones.has(m)) {
      reachedMilestones.add(m);
      trackEvent('scroll_depth', { depth: m });
    }
  });
}, { passive: true });

// === WuBook Widget Loader ===
function initWuBook(propertyId, containerId, lang = 'he', extraParams = {}) {
  if (typeof _WuBook === 'undefined') {
    console.warn('WuBook library not loaded');
    return;
  }
  const WuBook = new _WuBook(propertyId);
  const params = {
    lang,
    buttoncolor: '#1B4D6E',
    bgcolor: 'transparent',
    textcolor: '#1A1A2E',
    default_nights: 2,
    wbgoogle: 1,
    failback_lang: 'en',
    ...extraParams
  };
  WuBook.design_rwidget(containerId, params);
}

// Auto-init WuBook if container exists
const wbContainer = document.getElementById('_wbord_');
if (wbContainer) {
  const PROPERTY_ID = 'wb_7159b6d6-cf4b-11ea-97ba-001a4a5c09cf';
  const lang = document.documentElement.lang === 'en' ? 'en' : 'he';
  initWuBook(PROPERTY_ID, '_wbord_', lang);
}

// === Newsletter / Club Form ===
const clubForm = document.getElementById('club-form');
if (clubForm) {
  // Honeypot
  const honeypot = clubForm.querySelector('[name="website"]');

  // Rate limiting
  let lastSubmit = 0;

  clubForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check
    if (honeypot && honeypot.value !== '') return;

    // Rate limit
    if (Date.now() - lastSubmit < 10000) {
      showFormMessage(clubForm, 'error', 'אנא המתן לפני שליחה נוספת');
      return;
    }

    const btn = clubForm.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'שולח...';

    const data = new FormData(clubForm);
    const payload = Object.fromEntries(data.entries());
    delete payload.website; // remove honeypot

    try {
      // Submit to Supabase
      const res = await submitToSupabase(payload);
      if (res.ok) {
        lastSubmit = Date.now();
        showFormMessage(clubForm, 'success', '🎉 נרשמת בהצלחה למועדון! נשלח לך מבצעים ראשוניים בקרוב.');
        clubForm.reset();
        trackEvent('club_signup', { source: 'newsletter_form' });
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      showFormMessage(clubForm, 'error', 'אירעה שגיאה. אנא נסה שוב או צור קשר בטלפון.');
    } finally {
      btn.disabled = false;
      btn.textContent = btn.dataset.defaultText || 'הצטרף למועדון';
    }
  });
}

// Supabase submit function
async function submitToSupabase(payload) {
  const SUPABASE_URL = window.CITYSTAY_CONFIG?.supabaseUrl || '';
  const SUPABASE_ANON_KEY = window.CITYSTAY_CONFIG?.supabaseAnonKey || '';

  if (!SUPABASE_URL) {
    console.warn('Supabase not configured');
    return { ok: false };
  }

  return fetch(`${SUPABASE_URL}/rest/v1/club_members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({
      full_name:      payload.full_name,
      phone:          payload.phone,
      email:          payload.email,
      birthday:       payload.birthday || null,
      anniversary:    payload.anniversary || null,
      city:           payload.city || null,
      notes:          payload.notes || null,
      source:         'website_form',
      created_at:     new Date().toISOString()
    })
  });
}

// Form message helper
function showFormMessage(form, type, message) {
  let alert = form.querySelector('.alert');
  if (!alert) {
    alert = document.createElement('div');
    alert.className = 'alert';
    form.appendChild(alert);
  }
  alert.className = `alert alert-${type} show`;
  alert.textContent = message;
  alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (type === 'success') {
    setTimeout(() => alert.classList.remove('show'), 6000);
  }
}

// === Lightbox for gallery ===
function openLightbox(src, alt) {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.querySelector('img').src = src;
    lb.querySelector('img').alt = alt || '';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

const lightboxEl = document.getElementById('lightbox');
if (lightboxEl) {
  lightboxEl.addEventListener('click', (e) => {
    if (e.target === lightboxEl || e.target.classList.contains('lightbox-close')) {
      lightboxEl.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightboxEl.classList.contains('open')) {
      lightboxEl.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

document.querySelectorAll('[data-lightbox]').forEach(item => {
  item.addEventListener('click', () => {
    const img = item.querySelector('img');
    if (img) openLightbox(img.src, img.alt);
  });
});
