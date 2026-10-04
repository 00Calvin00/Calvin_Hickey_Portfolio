/**
 * Page behavior. Everything here is progressive enhancement: the page is
 * fully readable without JavaScript.
 */

const THEME_KEY = 'theme';
const THEME_COLORS = { light: '#f5f2eb', dark: '#050805' };

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage is unavailable; the choice just won't survive a reload.
  }
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

/** Light/dark toggle. Follows the OS setting until the visitor picks one. */
function initThemeToggle() {
  const systemDark = matchMedia('(prefers-color-scheme: dark)');
  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  for (const button of document.querySelectorAll('[data-theme-toggle]')) {
    button.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      storeTheme(next);
    });
  }

  systemDark.addEventListener('change', (event) => {
    if (!readStoredTheme()) applyTheme(event.matches ? 'dark' : 'light');
  });
}

initThemeToggle();

/** Disclosure menu for small screens. Closes on link click, Escape, or a click outside. */
function initMobileMenu() {
  const nav = document.querySelector('[data-nav]');
  const button = nav?.querySelector('.menu-toggle');
  if (!nav || !button) return;

  const setOpen = (open) => button.setAttribute('aria-expanded', String(open));
  const isOpen = () => button.getAttribute('aria-expanded') === 'true';

  button.addEventListener('click', () => setOpen(!isOpen()));

  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      button.focus();
    }
  });

  document.addEventListener('click', (event) => {
    if (isOpen() && !nav.contains(event.target)) setOpen(false);
  });
}

initMobileMenu();

/** Fade sections in as they scroll into view. Skipped entirely for reduced motion. */
function initScrollReveal() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) return;

  const targets = document.querySelectorAll(
    '.section-header, .timeline-item, .project-card, .mini-card, .skill-group, .interest, .groove',
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );

  for (const target of targets) {
    target.classList.add('reveal');
    observer.observe(target);
  }
  // Added last, so content is only hidden once the observer is watching it
  document.documentElement.classList.add('reveal-ready');
}

initScrollReveal();

/** Keep the footer copyright year current without editing the HTML each January. */
for (const el of document.querySelectorAll('[data-year]')) {
  el.textContent = String(new Date().getFullYear());
}

/** Load the drum machine only when its section is about to scroll into view. */
function initGrooveWhenVisible() {
  const root = document.querySelector('[data-groove]');
  if (!root) return;

  const load = () => import('./groove.js').then(({ initGroove }) => initGroove(root));

  if (!('IntersectionObserver' in window)) {
    load();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        load();
      }
    },
    { rootMargin: '400px 0px' },
  );
  observer.observe(root);
}

initGrooveWhenVisible();
