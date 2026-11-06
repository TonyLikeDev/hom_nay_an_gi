/* Trang Gieo Quẻ Chọn Món: nhấn vào lọ quẻ -> lọ lắc -> rớt ra 1 thẻ quẻ -> hiện món ăn. */
(() => {
  const COUNT_KEY = 'hnag:fortune-count';
  const SHAKE_MS = 1200;
  const DROP_MS = 550;

  /* Bộ 12 quẻ ẩm thực sáng tác riêng cho Hôm nay ăn gì? */
  const FORTUNES = [
    {
      num: '01',
      rank: 'THƯỢNG THƯỢNG · ĐẠI CÁT',
      poem: 'Bụng đang réo gọi từng hồi,\nQuẻ rơi đúng món tuyệt vời hôm nay!',
      advice: 'Lời bàn: Quẻ này báo hiệu lộc ăn cực vượng, chớ chần chừ kẻo nguội mất ngon.',
    },
    {
      num: '06',
      rank: 'THƯỢNG CÁT · ĐẮC VỊ',
      poem: 'Trăm năm trong cõi người ta,\nChưa biết ăn gì, quẻ ra món này!',
      advice: 'Lời bàn: Hương vị quen mà lạ, ăn một miếng là tỉnh táo suốt cả buổi.',
    },
    {
      num: '08',
      rank: 'ĐẠI CÁT · MỸ VỊ',
      poem: 'Lắc ống tre kêu lách cách,\nRơi ra một quẻ hết sạch băn khoăn.',
      advice: 'Lời bàn: Món này hợp vía bạn nhất trong khung giờ hiện tại, rủ thêm bạn bè càng vui.',
    },
    {
      num: '12',
      rank: 'THƯỢNG CÁT · LỘC THỰC',
      poem: 'Đói lòng chẳng biết chọn chi,\nThần Thực chỉ điểm: ăn đi kẻo thèm!',
      advice: 'Lời bàn: Cứ mạnh dạn gọi phần đầy đủ, hôm nay bạn xứng đáng được ăn ngon.',
    },
    {
      num: '15',
      rank: 'CÁT QUẺ · HỢP DUYÊN',
      poem: 'Ngồi buồn lắc thử ống xăm,\nAi ngờ trúng phóc món thầm ước ao.',
      advice: 'Lời bàn: Đừng lướt menu thêm nữa, chân ái của chiếc bụng đói đã lộ diện rồi.',
    },
    {
      num: '18',
      rank: 'ĐẠI LỢI · ẤM BỤNG',
      poem: 'Gió đưa cành trúc la đà,\nQuẻ rơi một cái, bước ra quán liền!',
      advice: 'Lời bàn: Món ăn vừa hợp thời tiết vừa hợp tâm trạng, ăn xong tinh thần phấn chấn.',
    },
    {
      num: '22',
      rank: 'THƯỢNG CÁT · NHẤT PHẨM',
      poem: 'Sáng trưa chiều tối xoay vần,\nCó duyên mới gặp mónần (món gần) hợp gu.',
      advice: 'Lời bàn: Một bữa ăn tròn vị sẽ giúp bạn giải tỏa hết mệt mỏi trong ngày.',
    },
    {
      num: '26',
      rank: 'CÁT TƯỜNG · HỒNG PHÚC',
      poem: 'Tay cầm ống quẻ lắc đều,\nThẻ rơi chỉ lối trăm điều ngon lành.',
      advice: 'Lời bàn: Hãy thưởng thức chậm rãi từng miếng đầu tiên để cảm nhận trọn vẹn vị ngon.',
    },
    {
      num: '29',
      rank: 'THƯỢNG CÁT · ĐỒNG ẨM',
      poem: 'Một cây làm chẳng nên non,\nMột quẻ rơi xuống, món ngon hiện hình!',
      advice: 'Lời bàn: Đi ăn một mình cũng tuyệt mà rủ cạ cứng đi cùng lại càng thêm rôm rả.',
    },
    {
      num: '33',
      rank: 'ĐẠI CÁT · KHAI VỊ',
      poem: 'Phân vân đứng giữa ngã ba,\nNhờ chiếc lọ quẻ chọn ra món hiền.',
      advice: 'Lời bàn: Đổi gió với hương vị này sẽ mang lại nguồn năng lượng mới mẻ cho bạn.',
    },
  ];

  /* Bộ tạo hiệu ứng âm thanh lắc ống tre & thẻ rơi bằng WebAudio thuần */
  class BambooSound {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    init() {
      if (!this.enabled) return null;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx ??= new AudioCtx();
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return this.ctx;
    }

    clack(freq = 520, gainVal = 0.14) {
      const ctx = this.init();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.45, now + 0.055);
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.065);
    }

    playShake() {
      if (!this.enabled) return;
      [0, 140, 270, 420, 560, 710, 860, 1020].forEach((ms, i) => {
        setTimeout(() => {
          this.clack(460 + (i % 3) * 95 + Math.random() * 60, 0.12);
        }, ms);
      });
    }

    playDrop() {
      if (!this.enabled) return;
      this.clack(740, 0.18);
      setTimeout(() => this.clack(580, 0.14), 160);
    }

    playReveal() {
      const ctx = this.init();
      if (!ctx) return;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      });
    }
  }

  const $ = (id) => document.getElementById(id);
  const jarStage = $('jar-stage');
  const jarTrigger = $('jar-trigger');
  const btnShake = $('btn-shake');
  const btnAgain = $('btn-again');
  const jarBadge = $('jar-step-badge');
  const jarStatus = $('jar-status');
  const jarCount = $('jar-count');
  const droppedNum = $('dropped-stick-num');
  const droppedRank = $('dropped-stick-rank');
  const placeholder = $('fortune-placeholder');
  const resultCard = $('fortune-result');
  const soundToggle = $('sound-toggle');
  const soundText = $('sound-text');
  const cuisineRow = $('fortune-cuisine');
  const mealRow = $('fortune-meal');

  const sound = new BambooSound();
  let cuisineFilter = 'all';
  let mealFilter = App.getMeal(); // Mặc định chọn theo khung giờ hiện tại
  let busy = false;

  const getCount = () => {
    try { return Number(localStorage.getItem(COUNT_KEY) || 0); } catch { return 0; }
  };

  const addCount = () => {
    const next = getCount() + 1;
    try { localStorage.setItem(COUNT_KEY, String(next)); } catch {}
    jarCount.textContent = next;
  };

  const pill = (key, label, pressed) =>
    `<button class="pill" type="button" data-key="${key}" aria-pressed="${pressed}">${label}</button>`;

  function renderFilters() {
    cuisineRow.innerHTML =
      pill('all', 'Tất cả ẩm thực', cuisineFilter === 'all') +
      Object.entries(FOOD.CUISINES)
        .map(([k, v]) => pill(k, v.name, cuisineFilter === k))
        .join('');

    mealRow.innerHTML =
      pill('all', 'Mọi bữa', mealFilter === 'all') +
      Object.entries(FOOD.MEALS)
        .map(([k, v]) => pill(k, `Bữa ${v.label.toLowerCase()}`, mealFilter === k))
        .join('');
  }

  function getPool() {
    const filtered = FOOD.DISHES.filter(
      (d) =>
        (cuisineFilter === 'all' || d.cuisine === cuisineFilter) &&
        (mealFilter === 'all' || d.meals.includes(mealFilter))
    );
    return filtered.length ? filtered : FOOD.DISHES;
  }

  async function shakeAndDraw() {
    if (busy) return;
    busy = true;
    btnShake.disabled = true;

    const pool = getPool();
    const dish = App.pickDish(pool);
    const fortune = App.randomItem(FORTUNES);

    // Tải trước ảnh món ăn để hiện ngay khi rớt quẻ
    new Image().src = App.photo(dish, 800, 600);

    const animate = !App.reduceMotion();

    // Bước 1: Lắc lọ quẻ
    jarStage.dataset.state = 'shaking';
    jarBadge.textContent = 'Đang lắc ống quẻ...';
    jarStatus.textContent = 'Lọ quẻ đang lắc đều, chờ thẻ xăm rơi ra nhé...';
    btnShake.textContent = 'Đang lắc quẻ...';

    if (animate) {
      sound.playShake();
      await App.wait(SHAKE_MS);
    }

    // Bước 2: Rớt 1 thẻ quẻ ra ngoài
    droppedNum.textContent = fortune.num;
    droppedRank.textContent = fortune.rank.split('·')[0].trim();
    jarStage.dataset.state = 'dropping';
    jarBadge.textContent = `Rớt ra Quẻ số ${fortune.num}!`;
    jarStatus.innerHTML = `Đã rớt ra <strong>Quẻ số ${fortune.num}</strong> — đang mở món ăn...`;

    if (animate) {
      sound.playDrop();
      await App.wait(DROP_MS);
    }

    // Bước 3: Hiện thẻ giải quẻ & món ăn, đồng bộ màu chủ đề theo nền ẩm thực
    document.body.dataset.cuisine = dish.cuisine;
    const mealKey = dish.meals.includes(App.getMeal()) ? App.getMeal() : dish.meals[0];

    $('slip-num').textContent = `QUẺ SỐ ${fortune.num}`;
    $('slip-rank').textContent = fortune.rank;
    $('slip-poem').textContent = fortune.poem;
    $('slip-advice').textContent = fortune.advice;

    $('dish-photo').src = App.photo(dish, 800, 600);
    $('dish-photo').alt = dish.name;
    $('dish-link').href = App.dishUrl(dish);
    $('dish-meta').textContent = `${FOOD.CUISINES[dish.cuisine].name} · ${FOOD.MEALS[mealKey].label}`;
    $('dish-name').textContent = dish.name;
    $('dish-desc').textContent = dish.desc;
    $('btn-maps').href = App.mapsUrl(dish);
    $('btn-detail').href = App.dishUrl(dish);

    placeholder.hidden = true;
    resultCard.hidden = false;
    resultCard.classList.remove('is-bounce');
    void resultCard.offsetWidth;
    resultCard.classList.add('is-bounce');

    jarStage.dataset.state = 'revealed';
    jarBadge.textContent = `Quẻ số ${fortune.num} · ${dish.name}`;
    jarStatus.innerHTML = `Ứng với <strong>${dish.name}</strong>! Nhấn vào lọ quẻ nếu muốn lắc lại.`;
    btnShake.textContent = 'Lắc lại quẻ khác';
    btnShake.disabled = false;
    busy = false;

    sound.playReveal();
    addCount();
    App.setLast(dish.id);
  }

  // Nhấn trực tiếp vào lọ quẻ hoặc dùng phím Enter/Space trên lọ quẻ
  jarTrigger.addEventListener('click', shakeAndDraw);
  jarTrigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      shakeAndDraw();
    }
  });

  btnShake.addEventListener('click', shakeAndDraw);
  btnAgain.addEventListener('click', shakeAndDraw);

  // Lọc theo nền ẩm thực
  cuisineRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || busy) return;
    cuisineFilter = btn.dataset.key;
    if (cuisineFilter === 'all') {
      delete document.body.dataset.cuisine;
    } else {
      document.body.dataset.cuisine = cuisineFilter;
    }
    renderFilters();
  });

  // Lọc theo bữa ăn
  mealRow.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill');
    if (!btn || busy) return;
    mealFilter = btn.dataset.key;
    renderFilters();
  });

  // Bật / tắt âm thanh
  soundToggle.addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    soundToggle.setAttribute('aria-pressed', String(sound.enabled));
    soundText.textContent = sound.enabled ? 'Âm thanh: Bật' : 'Âm thanh: Tắt';
  });

  // Khởi tạo
  jarCount.textContent = getCount();
  renderFilters();
})();
