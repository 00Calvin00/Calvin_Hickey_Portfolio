/*
 * Runs in <head> as a small blocking script, before first paint:
 *
 * 1. Marks the page as JavaScript-enabled (html.js) so enhanced layouts,
 *    like the collapsed mobile menu, apply from the first frame instead of
 *    shifting the page once js/main.js loads.
 * 2. Applies the saved (or system) color theme so the page never flashes
 *    the wrong colors. js/main.js wires up the toggle after load.
 */
(() => {
  const root = document.documentElement;
  root.classList.add('js');

  let theme = null;
  try {
    theme = localStorage.getItem('theme');
  } catch {
    // Storage can be blocked (private mode, strict settings); fall back to the system setting.
  }
  if (theme !== 'light' && theme !== 'dark') {
    theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.dataset.theme = theme;
})();
