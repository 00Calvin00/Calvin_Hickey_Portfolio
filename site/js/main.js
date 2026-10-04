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

  button.hidden = false;
  nav.classList.add('is-enhanced');

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

/** Keep the footer copyright year current without editing the HTML each January. */
for (const el of document.querySelectorAll('[data-year]')) {
  el.textContent = String(new Date().getFullYear());
}
