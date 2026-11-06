/* Trang Kết quả: ?mode=any, ?cuisine=viet (có quay) và ?dish=pho-bo (hiện thẳng). */
(() => {
  // 12 x 60 + 3 x 120 + 200 + 320 = 1600ms: tên món đổi nhanh rồi chậm dần
  const SCHEDULE = [...Array(12).fill(60), 120, 120, 120, 200, 320];

  const $ = (id) => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const qDish = params.get('dish');
  const qCuisine = params.get('cuisine');
  const card = $('result');
  const meal = App.getMeal();

  let pool = FOOD.DISHES;

  function show(dish) {
    const mealKey = dish.meals.includes(meal) ? meal : dish.meals[0];
    document.body.dataset.cuisine = dish.cuisine;
    document.title = `${dish.name} | Hôm nay ăn gì?`;
    if (qDish) history.replaceState(null, '', App.dishUrl(dish));
    $('dish-photo').src = App.photo(dish, 1200, 900);
    $('dish-photo').alt = dish.name;
    $('dish-meta').textContent = `${FOOD.CUISINES[dish.cuisine].name} · ${FOOD.MEALS[mealKey].label}`;
    $('dish-name').textContent = dish.name;
    $('dish-desc').textContent = dish.desc;
    $('btn-maps').href = App.mapsUrl(dish);
    $('result-live').textContent = `Hôm nay ăn: ${dish.name}`;
    App.setLast(dish.id);
  }

  function showEmpty(title, text) {
    card.hidden = true;
    $('empty-title').textContent = title;
    $('empty-text').textContent = text;
    $('empty').hidden = false;
  }

  async function spin() {
    if (card.classList.contains('is-spinning')) return;
    const dish = App.pickDish(pool);
    if (App.reduceMotion()) return show(dish);

    new Image().src = App.photo(dish, 1200, 900);   // tải sẵn để ảnh hiện ngay khi dừng
    if (!qCuisine) delete document.body.dataset.cuisine;
    card.classList.remove('is-bounce');
    card.classList.add('is-spinning');
    $('dish-meta').textContent = 'Đang quay...';
    $('dish-desc').textContent = 'Chờ một chút nhé.';

    for (const ms of SCHEDULE) {
      $('dish-name').textContent = App.randomItem(pool.filter((d) => d.name !== $('dish-name').textContent)).name;
      await App.wait(ms);
    }

    card.classList.remove('is-spinning');
    show(dish);
    void card.offsetWidth;
    card.classList.add('is-bounce');
  }

  function init() {
    if (qDish) {
      const dish = FOOD.DISHES.find((d) => d.id === qDish);
      if (!dish) return showEmpty('Món này chưa có trong thực đơn', 'Có thể đường dẫn bị sai. Để tụi mình chọn cho bạn món khác nhé.');
      show(dish);
    } else if (qCuisine) {
      if (!Object.hasOwn(FOOD.CUISINES, qCuisine)) return showEmpty('Chưa có nền ẩm thực này', 'Trong lúc chờ, bạn thử chọn bất kỳ món nào nhé.');
      document.body.dataset.cuisine = qCuisine;
      pool = FOOD.DISHES.filter((d) => d.cuisine === qCuisine);
      spin();
    } else {
      spin();
    }
    $('btn-again').addEventListener('click', spin);
  }

  init();
})();
