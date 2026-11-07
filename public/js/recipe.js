/* Frontend only: recipes will appear once reviewed content is available. */
(() => {
  const id = new URLSearchParams(location.search).get('dish');
  const dish = FOOD.DISHES.find(item => item.id === id);
  const $ = id => document.getElementById(id);
  if (!dish) {
    if (id) {
      $('recipe-status').textContent = 'Không tìm thấy món ăn';
      $('recipe-message').textContent = 'Đường dẫn có thể không còn đúng. Bạn hãy chọn một món trong danh sách nhé.';
    }
    return;
  }
  document.body.dataset.cuisine = dish.cuisine;
  document.title = `Cách nấu ${dish.name} | Hôm nay ăn gì?`;
  $('recipe-meta').innerHTML = App.cuisineLabel(dish.cuisine);
  $('recipe-name').textContent = dish.name;
  $('recipe-desc').textContent = dish.desc;
  $('recipe-back').href = App.dishUrl(dish);
  $('recipe-back').textContent = '← Quay lại món vừa chọn';
  $('recipe-status').textContent = 'Công thức đang được cập nhật';
  $('recipe-message').textContent = 'Nguyên liệu và cách chế biến món này sẽ được bổ sung sau. Trong lúc chờ, bạn có thể tìm quán gần đây hoặc khám phá món khác.';
  $('recipe-maps').href = App.mapsUrl(dish);
  $('recipe-maps').hidden = false;
  const save = document.createElement('div'); save.innerHTML = Favorites.button('dishes', dish.id, dish.name, true);
  const recipe = RECIPES[dish.id];
  (recipe ? $('detail-name') : $('recipe-name')).after(save);
  if (!recipe) return;
  $('recipe-pending').hidden = true;
  $('recipe-detail').hidden = false;
  $('detail-back').href = App.dishUrl(dish);
  $('detail-photo').addEventListener('error', () => { $('detail-photo').src = 'images/restaurants/placeholder.svg'; }, { once: true });
  $('detail-photo').src = App.photo(dish, 1000, 750);
  $('detail-photo').alt = dish.name;
  $('detail-meta').innerHTML = App.cuisineLabel(dish.cuisine);
  const currentMeal = App.getMeal();
  const mealKey = dish.meals.includes(currentMeal) ? currentMeal : dish.meals[0];
  $('detail-meal').innerHTML = App.mealIcon(mealKey);
  $('detail-meal').append(document.createTextNode(FOOD.MEALS[mealKey].label));
  $('detail-meal').hidden = false;
  $('detail-vegetarian').hidden = !App.isVegetarian(dish);
  $('detail-vegetarian').title = App.vegetarianNote(dish);
    $('detail-vegetarian').dataset.vegetarianDish = dish.id;
    $('detail-vegetarian').setAttribute('aria-label', 'Ăn chay — xem nguyên liệu và xác minh của ' + dish.name);
  $('detail-name').textContent = dish.name;
  $('detail-desc').textContent = dish.desc;
  let servings = recipe.servings;
  let servingFact;
  const facts = [['Khẩu phần', `${servings} người`], ['Chuẩn bị', recipe.prep], ['Chế biến', recipe.cook]];
  for (const [title, value] of facts) {
    const group = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = title;
    dd.textContent = value;
    if (title === 'Khẩu phần') servingFact = dd;
    group.append(dt, dd);
    $('recipe-facts').append(group);
  }
  if (recipe.soak) {
    $('recipe-soak').hidden = false;
    $('recipe-soak').textContent = recipe.soak;
  }
  const checks = [];
  const amounts = [];
  const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
  function formatQuantity(ingredient) {
    if (ingredient.text) return ingredient.text;
    const scaled = value => numberFormat.format(value * servings / recipe.servings);
    const value = Array.isArray(ingredient.amount)
      ? ingredient.amount.map(scaled).join('–') : scaled(ingredient.amount);
    return `${value} ${ingredient.unit}`;
  }
  function updateServings(announce = false) {
    $('serving-count').textContent = `${servings}`;
    servingFact.textContent = `${servings} người`;
    $('ingredients-help').textContent = `Cho ${servings} người. Đánh dấu những gì đã chuẩn bị.`;
    $('serving-minus').disabled = servings <= 1;
    $('serving-plus').disabled = servings >= 12;
    amounts.forEach((amount, index) => { amount.textContent = formatQuantity(recipe.ingredients[index]); });
    if (announce) $('serving-status').textContent = `Đã cập nhật nguyên liệu cho ${servings} người. Lượng lẻ được làm tròn đến hai chữ số thập phân; gia vị nêm lại theo khẩu vị.`;
  }
  $('serving-minus').addEventListener('click', () => {
    if (servings > 1) { servings--; updateServings(true); }
  });
  $('serving-plus').addEventListener('click', () => {
    if (servings < 12) { servings++; updateServings(true); }
  });
  const updateProgress = () => {
    const done = checks.filter(input => input.checked).length;
    $('ingredients-progress').textContent = `Đã chuẩn bị ${done}/${checks.length} nguyên liệu.`;
    $('ingredients-reset').disabled = done === 0;
  };
  for (const ingredient of recipe.ingredients) {
    const li = document.createElement('li');
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    const text = document.createElement('span');
    const amount = document.createElement('strong');
    amounts.push(amount);
    amount.textContent = formatQuantity(ingredient);
    text.append(amount, document.createTextNode(` ${ingredient.name}`));
    label.append(input, text);
    li.append(label);
    $('recipe-ingredients').append(li);
    checks.push(input);
    input.addEventListener('change', updateProgress);
  }
  $('ingredients-reset').addEventListener('click', () => {
    checks.forEach(input => { input.checked = false; });
    updateProgress();
  });
  updateProgress();
  updateServings();
  const stepChecks = [];
  const updateStepProgress = () => {
    const done = stepChecks.filter(input => input.checked).length;
    $('steps-progress').max = stepChecks.length;
    $('steps-progress').value = done;
    $('steps-status').textContent = done === stepChecks.length
      ? `Hoàn thành ${done}/${stepChecks.length} bước. Món đã sẵn sàng, chúc bạn ngon miệng!`
      : `Đã hoàn thành ${done}/${stepChecks.length} bước.`;
    $('steps-reset').disabled = done === 0;
  };
  for (const [title, instruction] of recipe.steps) {
    const step = document.createElement('li');
    const heading = document.createElement('h3');
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    const titleText = document.createElement('span');
    titleText.textContent = title;
    label.append(checkbox, titleText);
    heading.append(label);
    const text = document.createElement('p');
    text.textContent = instruction;
    checkbox.addEventListener('change', () => {
      step.classList.toggle('is-complete', checkbox.checked);
      updateStepProgress();
    });
    stepChecks.push(checkbox);
    step.append(heading, text);
    $('recipe-steps').append(step);
  }
  $('steps-reset').addEventListener('click', () => {
    stepChecks.forEach(input => {
      input.checked = false;
      input.dispatchEvent(new Event('change'));
    });
  });
  updateStepProgress();
  $('recipe-tip').textContent = recipe.tip;
  $('recipe-source').textContent = `${recipe.source.label} ↗`;
  $('recipe-source').href = recipe.source.url;
})();
