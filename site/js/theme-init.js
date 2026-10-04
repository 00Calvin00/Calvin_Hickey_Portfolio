/*
 * Applies the saved (or system) color theme before first paint so the page
 * never flashes the wrong colors. Loaded as a small blocking script in <head>;
 * js/main.js wires up the toggle once the page has loaded.
 */
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch {
    // Storage can be blocked (private mode, strict settings); fall back to the system setting.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.dataset.theme = theme;
})();
