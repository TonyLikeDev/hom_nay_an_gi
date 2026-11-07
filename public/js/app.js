/* Dùng chung cho mọi trang: header và các hàm chọn món. */
const App = (() => {
  const LAST_KEY = 'hnag:last-dish';
  const NAV = [
    { href: 'cuisines.html', label: 'Ẩm thực' },
    { href: 'dishes.html', label: 'Tất cả món ăn' },
    { href: 'restaurants.html', label: 'Quán ăn' },
    { href: 'favorites.html', label: 'Yêu thích' },
    { href: 'about.html', label: 'Giới thiệu' },
  ];

  /** Bữa ăn theo giờ: 05:00 sáng, 11:00 trưa, 13:00 chiều, 18:00 tối, 22:00 khuya. */
  function getMeal(date = new Date()) {
    const h = date.getHours() + date.getMinutes() / 60;
    if (h >= 5 && h < 11) return 'sang';
    if (h >= 11 && h < 13) return 'trua';
    if (h >= 13 && h < 18) return 'chieu';
    if (h >= 18 && h < 22) return 'toi';
    return 'khuya';
  }

  const randomItem = (list) => list[Math.floor(Math.random() * list.length)];
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Trình duyệt chặn lưu trữ thì chỉ mất tính năng "không lặp món", trang vẫn chạy.
  const getLast = () => { try { return sessionStorage.getItem(LAST_KEY); } catch { return null; } };
  const setLast = (id) => { try { sessionStorage.setItem(LAST_KEY, id); } catch { /* bỏ qua */ } };

  /** Ưu tiên món hợp bữa hiện tại, không lặp lại món vừa ra. */
  function pickDish(pool) {
    const last = getLast();
    const meal = getMeal();
    const fit = pool.filter((d) => d.meals.includes(meal));
    const tiers = [fit.filter((d) => d.id !== last), pool.filter((d) => d.id !== last), pool];
    return randomItem(tiers.find((t) => t.length));
  }

  const photo = (dish, w, h) => !dish ? '/images/restaurants/placeholder.svg' : dish.imageUrl || (!dish.photo ? '/images/restaurants/placeholder.svg' : null) ||
    `https://images.unsplash.com/${dish.photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70${dish.crop || ''}`;
  const dishUrl = (dish) => `result.html?dish=${dish.id}`;
  const mapsUrl = (dish) =>
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${dish.name} gần đây`);

  function renderChrome() {
    const currentPage = location.pathname.split('/').pop();
    const page = currentPage === 'restaurant.html' ? 'restaurants.html' : currentPage;
    const header = document.querySelector('[data-header]');
    header.innerHTML = `
      <a class="logo" href="index.html">Hôm nay ăn gì?</a>
      <div class="header-controls">
        <div class="theme-switcher">
          <button class="btn theme-trigger" type="button" aria-label="Chọn chế độ giao diện" aria-expanded="false" aria-controls="theme-options" title="Chọn chế độ giao diện"></button>
          <div class="theme-picker" id="theme-options" role="group" aria-label="Chế độ giao diện" hidden>
          <button class="theme-choice" data-theme-mode="light" type="button" aria-label="Chế độ sáng" title="Sáng" aria-pressed="false"><svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg><span>Sáng</span></button>
          <button class="theme-choice" data-theme-mode="dark" type="button" aria-label="Chế độ tối" title="Tối" aria-pressed="false"><svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/></svg><span>Tối</span></button>
          <button class="theme-choice" data-theme-mode="system" type="button" aria-label="Theo hệ thống" title="Theo hệ thống" aria-pressed="false"><svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg><span>Theo hệ thống</span></button>
        </div>
        </div>
        <button class="btn nav-toggle" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
      </div>
      <nav class="nav" id="nav" aria-label="Menu chính">
        <ul>${NAV.map((n) => `<li><a href="${n.href}"${n.href === page ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('')}</ul>
      </nav>`;
    const toggle = header.querySelector('.nav-toggle');
    const themeChoices = header.querySelectorAll('[data-theme-mode]');
    const themeSwitcher = header.querySelector('.theme-switcher');
    const themeTrigger = header.querySelector('.theme-trigger');
    const themeOptions = header.querySelector('.theme-picker');
    const closeTheme = (restoreFocus = false) => {
      themeOptions.hidden = true;
      themeTrigger.setAttribute('aria-expanded', 'false');
      if (restoreFocus) themeTrigger.focus();
    };
    themeTrigger.addEventListener('click', () => {
      const opening = themeOptions.hidden;
      themeOptions.hidden = !opening;
      themeTrigger.setAttribute('aria-expanded', String(opening));
    });
    themeTrigger.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        themeOptions.hidden = false;
        themeTrigger.setAttribute('aria-expanded', 'true');
        (Array.from(themeChoices).find(button => button.dataset.themeMode === SiteTheme.getMode()) || themeChoices[0]).focus();
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!themeOptions.hidden && !themeSwitcher.contains(event.target)) closeTheme();
    });
    themeSwitcher.addEventListener('focusout', event => {
      if (!themeSwitcher.contains(event.relatedTarget)) closeTheme();
    });
    themeSwitcher.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !themeOptions.hidden) {
        event.preventDefault();
        event.stopPropagation();
        closeTheme(true);
      }
    });
    const updateThemeButtons = () => {
      const mode = SiteTheme.getMode();
      themeChoices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeMode === mode)));
      const selected = Array.from(themeChoices).find(button => button.dataset.themeMode === mode);
      themeTrigger.innerHTML = selected.querySelector('svg').outerHTML;
      themeTrigger.title = 'Giao diện: ' + selected.textContent.trim();
      themeTrigger.setAttribute('aria-label', themeTrigger.title + '. Chọn chế độ giao diện');
    };
    themeChoices.forEach(button => button.addEventListener('click', () => {
      SiteTheme.setMode(button.dataset.themeMode);
      closeTheme(true);
    }));
    document.addEventListener('themechange', updateThemeButtons);
    updateThemeButtons();
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? 'Đóng' : 'Menu';
    });
    const closeNav = (restoreFocus = false) => {
      header.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Menu';
      if (restoreFocus) toggle.focus();
    };
    header.addEventListener('keydown', event => {
      if (event.key === 'Escape' && header.classList.contains('is-open')) {
        event.preventDefault(); closeNav(true);
      }
    });
    document.addEventListener('pointerdown', event => {
      if (!header.contains(event.target)) closeNav();
    });
    header.addEventListener('focusout', event => {
      if (!header.contains(event.relatedTarget)) closeNav();
    });
    matchMedia('(min-width: 768px)').addEventListener('change', () => closeNav());
  }

  // Local SVG flags work even on platforms without flag emoji glyphs.
  const cuisineLabel = (key) => {
    const cuisine = FOOD.CUISINES[key];
    if (cuisine.icon === 'globe') return `<svg class="action-icon cuisine-globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 6h14M5 18h14"/></svg> ${cuisine.name}`;
    return `<img class="country-flag" src="images/flags/${key}.svg" alt="" width="24" height="16" aria-hidden="true"> ${cuisine.name}`;
  };

  const mealPaths = {
    sang: '<path d="M3 17h18M5 13a7 7 0 0 1 14 0M12 2v3M3 6l2 2M21 6l-2 2M2 13h2M20 13h2M7 21h10"/>',
    trua: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/>',
    chieu: '<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5ZM17 9h2a3 3 0 0 1 0 6h-2M3 22h16M8 2v2M13 2v2"/>',
    toi: '<path d="M20 15a8 8 0 0 1-11-11 8 8 0 1 0 11 11Z"/>',
    khuya: '<path d="M15 4a7 7 0 1 0 5 11 7 7 0 0 1-5-11ZM19 2v4M17 4h4M22 8v2M21 9h2"/>',
  };
  const mealIcon = key => `<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${mealPaths[key]}</svg>`;

  renderChrome();

  // A failed remote photo keeps its space and never leaves a broken-image glyph.
  document.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.closest('main') || image.closest('.delivery-link, .delivery-dialog')) return;
    if (image.classList.contains('country-flag') || image.src.endsWith('/images/restaurants/placeholder.svg')) return;
    image.src = 'images/restaurants/placeholder.svg';
  }, true);

  const isVegetarian = dish => ['reviewed', 'source-declared'].includes(dish.vegetarianReview?.status);
  const vegetarianNote = dish => dish.vegetarianReview?.status === 'source-declared'
    ? 'Theo thông tin món chay của quán; vui lòng kiểm tra nguyên liệu, nước dùng và sốt khi gọi món.'
    : 'Áp dụng cho phiên bản nguyên liệu được mô tả trên website; thành phần tại từng quán có thể khác.';

  return { getMeal, randomItem, wait, reduceMotion, getLast, setLast, pickDish, photo, dishUrl, mapsUrl, cuisineLabel, mealIcon, isVegetarian, vegetarianNote };
})();
