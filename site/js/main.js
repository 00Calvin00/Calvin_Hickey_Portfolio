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
