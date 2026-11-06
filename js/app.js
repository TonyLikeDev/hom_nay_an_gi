/* Dùng chung cho mọi trang: header và các hàm chọn món. */
const App = (() => {
  const LAST_KEY = 'hnag:last-dish';
  const NAV = [
    { href: 'que-trua.html', label: 'Gieo quẻ' },
    { href: 'cuisines.html', label: 'Ẩm thực' },
    { href: 'dishes.html', label: 'Tất cả món ăn' },
    { href: 'about.html', label: 'Giới thiệu' },
  ];

  /** Bữa ăn theo giờ: 05:00 sáng, 10:30 trưa, 16:00 tối, 22:00 khuya. */
  function getMeal(date = new Date()) {
    const h = date.getHours() + date.getMinutes() / 60;
    if (h >= 5 && h < 10.5) return 'sang';
    if (h >= 10.5 && h < 16) return 'trua';
    if (h >= 16 && h < 22) return 'toi';
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

  const photo = (dish, w, h) =>
    `https://images.unsplash.com/${dish.photo}?auto=format&fit=crop&w=${w}&h=${h}&q=70${dish.crop || ''}`;
  const dishUrl = (dish) => `result.html?dish=${dish.id}`;
  const mapsUrl = (dish) =>
    'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${dish.name} gần đây`);

  function renderChrome() {
    const page = location.pathname.split('/').pop();
    const header = document.querySelector('[data-header]');
    header.innerHTML = `
      <a class="logo" href="index.html">Hôm nay ăn gì?</a>
      <button class="btn nav-toggle" type="button" aria-expanded="false" aria-controls="nav">Menu</button>
      <nav class="nav" id="nav" aria-label="Menu chính">
        <ul>${NAV.map((n) => `<li><a href="${n.href}"${n.href === page ? ' aria-current="page"' : ''}>${n.label}</a></li>`).join('')}</ul>
      </nav>`;
    const toggle = header.querySelector('.nav-toggle');
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open);
      toggle.textContent = open ? 'Đóng' : 'Menu';
    });
  }

  renderChrome();

  return { getMeal, randomItem, wait, reduceMotion, setLast, pickDish, photo, dishUrl, mapsUrl };
})();
