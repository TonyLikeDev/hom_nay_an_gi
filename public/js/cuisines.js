/* Trang Ẩm thực: lưới thẻ và máy quay xèng "Bất ngờ đi!". */
(() => {
  const SPIN_MS = 1500;
  const BLINK_MS = 400;
  const REPEATS = 5;       // lặp danh sách cho đủ dài để quay
  const TARGET_ROUND = 3;  // dừng ở vòng thứ tư, nên luôn có mục ở trên và dưới

  const keys = Object.keys(FOOD.CUISINES);
  const slot = document.getElementById('slot');
  const reelCuisine = document.getElementById('reel-cuisine');
  const reelDish = document.getElementById('reel-dish');
  const btnSpin = document.getElementById('slot-spin');
  const btnClose = document.getElementById('slot-close');
  const status = document.getElementById('slot-status');
  let spinning = false;
  let spinUI;

  document.getElementById('cuisine-grid').innerHTML = keys.map((key) => {
    const cuisine = FOOD.CUISINES[key];
    const cover = FOOD.DISHES.find((d) => d.id === cuisine.cover);
    return `<a class="cuisine" data-cuisine="${key}" href="result.html?cuisine=${key}">
      <span class="cuisine__photo"><img src="${App.photo(cover, 640, 480)}" alt="${cover.name}" width="640" height="480" loading="lazy"></span>
      <span class="cuisine__text">
        <span class="cuisine__name">${App.cuisineLabel(key)}</span>
        <span class="cuisine__desc">${cuisine.desc}</span>
      </span>
    </a>`;
  }).join('') + `<button class="surprise" id="open-slot" type="button" aria-haspopup="dialog" aria-controls="slot">
      <span class="surprise__name">Bất ngờ đi!</span>
      <span class="surprise__desc">Không chọn được? Để máy quay giúp bạn cả nền ẩm thực lẫn món ăn.</span>
    </button>`;

  const fillReel = (reel, labels) => {
    reel.innerHTML = Array(REPEATS).fill(labels).flat().map((label) => `<li>${label}</li>`).join('');
  };

  /** Đưa mục thứ `index` vào hàng giữa. Đo hàng thật, không suy ra từ khung. */
  function moveReel(reel, index, animate) {
    const row = reel.firstElementChild.offsetHeight;
    reel.style.transition = animate ? `transform ${SPIN_MS}ms cubic-bezier(.15, .85, .25, 1)` : 'none';
    reel.style.transform = `translateY(${-(index - 1) * row}px)`;
  }

  const stopIndex = (labels, label) => TARGET_ROUND * labels.length + labels.indexOf(label);

  function resetSlotColor() {
    delete slot.dataset.cuisine;
    slot.classList.remove('is-blinking');
  }

  function resetSlot() {
    resetSlotColor();
    const eligible=spinUI.pool();
    const availableKeys=keys.filter(key=>eligible.some(d=>d.cuisine===key));
    fillReel(reelCuisine, availableKeys.length?availableKeys.map(k=>App.cuisineLabel(k)):['—']);
    fillReel(reelDish, eligible.length?eligible.slice(0,5).map(d=>d.name):['Chưa có món phù hợp']);
    moveReel(reelCuisine, 1, false);
    moveReel(reelDish, 1, false);
    status.textContent = eligible.length?'Bấm Quay để chọn trong '+eligible.length+' món phù hợp.':'Chưa có món phù hợp. Hãy bỏ bớt điều kiện.';
    spinUI.setLocked(false);
    btnClose.disabled = false;
  }

  async function spin() {
    if (spinning || !spinUI.pool().length) return;
    spinning = true;
    spinUI.setLocked(true);
    btnSpin.disabled = true;
    btnClose.disabled = true;
    resetSlotColor();

    // Chọn trước, hai cuộn quay chỉ để trình diễn kết quả này.
    const meal = App.getMeal();
    const eligible=spinUI.pool();
    const availableKeys=keys.filter(key=>eligible.some(d=>d.cuisine===key));
    const cuisine=App.randomItem(availableKeys);
    const pool=eligible.filter(d=>d.cuisine===cuisine);
    const dish = App.pickDish(pool);
    const cuisineName = FOOD.CUISINES[cuisine].name;
    const cuisineLabels = availableKeys.map((k) => App.cuisineLabel(k));
    const dishLabels = [...pool]
      .sort((a, b) => b.meals.includes(meal) - a.meals.includes(meal))
      .map((d) => d.name);

    fillReel(reelCuisine, cuisineLabels);
    moveReel(reelCuisine, 1, false);

    if (App.reduceMotion()) {
      slot.dataset.cuisine = cuisine;
      moveReel(reelCuisine, stopIndex(cuisineLabels, App.cuisineLabel(cuisine)), false);
      fillReel(reelDish, dishLabels);
      moveReel(reelDish, stopIndex(dishLabels, dish.name), false);
      status.textContent = `${cuisineName}: ${dish.name}`;
      await App.wait(BLINK_MS);
      const query=SpinFilters.params(spinUI.options);query.set('dish',dish.id);query.set('from','slot');location.href='result.html?'+query;
      return;
    }

    status.textContent = 'Đang quay nền ẩm thực...';
    void reelCuisine.offsetHeight;
    moveReel(reelCuisine, stopIndex(cuisineLabels, App.cuisineLabel(cuisine)), true);
    await App.wait(SPIN_MS);

    // Chỉ nạp cuộn món sau khi cuộn ẩm thực dừng, nếu không sẽ lộ kết quả.
    slot.dataset.cuisine = cuisine;
    status.textContent = `${cuisineName}! Đang chọn món...`;
    fillReel(reelDish, dishLabels);
    moveReel(reelDish, 1, false);
    void reelDish.offsetHeight;
    moveReel(reelDish, stopIndex(dishLabels, dish.name), true);
    await App.wait(SPIN_MS);

    status.textContent = `Hôm nay ăn ${dish.name}!`;
    slot.classList.add('is-blinking');
    await App.wait(BLINK_MS);
    const query=SpinFilters.params(spinUI.options);query.set('dish',dish.id);query.set('from','slot');location.href='result.html?'+query;
  }

  spinUI=SpinOptionsUI.mount({button:btnSpin,label:'Quay',onChange:()=>{if(slot.open&&!spinning)resetSlot();}});
  function openSlot() {
    slot.showModal();
    resetSlot();
    (btnSpin.disabled?document.getElementById('spin-options-trigger'):btnSpin).focus();
  }
  document.getElementById('open-slot').addEventListener('click',openSlot);
  if(location.hash==='#surprise')openSlot();
  btnSpin.addEventListener('click', spin);
  btnClose.addEventListener('click', () => slot.close());
  slot.addEventListener('close',()=>document.getElementById('open-slot').focus());

  // Bấm ra ngoài hộp thì đóng. Đang quay thì không cho đóng bằng bất kỳ cách nào.
  slot.addEventListener('click', e => {
    const rect = slot.getBoundingClientRect();
    if (e.target === slot && !spinning && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) slot.close();
  });
  slot.addEventListener('cancel', (e) => { if (spinning) e.preventDefault(); });
  slot.addEventListener('keydown', (e) => { if (e.key === 'Escape' && spinning) e.preventDefault(); });

  // Bấm Back từ trang Kết quả: trình duyệt khôi phục trang đang khoá, phải mở khoá lại.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    spinning = false;
    slot.close();
  });
})();
