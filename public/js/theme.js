/* Run before CSS so a saved theme is applied before the first paint. */
const SiteTheme = (() => {
  const key = 'hnag:theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  const valid = value => value === 'light' || value === 'dark';
  let choice = null;
  let transitionTimer;
  try { const saved = localStorage.getItem(key); if (valid(saved)) choice = saved; } catch { /* Optional storage. */ }
  function apply() {
    document.documentElement.dataset.theme = choice || (system.matches ? 'dark' : 'light');
    document.dispatchEvent(new Event('themechange'));
  }
  system.addEventListener('change', () => { if (!choice) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = valid(event.newValue) ? event.newValue : null;
    apply();
  });
  apply();
  return {
    isDark: () => document.documentElement.dataset.theme === 'dark',
    getMode: () => choice || 'system',
    setMode(mode) {
      if (!valid(mode) && mode !== 'system') return;
      const root = document.documentElement;
      clearTimeout(transitionTimer);
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        root.classList.add('theme-switching');
        // Commit the old colors with transitions enabled before changing theme.
        void root.offsetWidth;
        transitionTimer = setTimeout(() => root.classList.remove('theme-switching'), 400);
      } else root.classList.remove('theme-switching');
      choice = mode === 'system' ? null : mode;
      try { localStorage.setItem(key, mode); } catch { /* Switching still works. */ }
      apply();
    },
  };
})();
