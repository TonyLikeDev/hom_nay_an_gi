/* Trang Tất cả món ăn: lưới món và bộ lọc theo ẩm thực, bữa ăn. */
(() => {
  const grid = document.getElementById('dish-grid');
  const count = document.getElementById('count');
  const filters = { cuisine: 'all', meal: 'all' };

  const pills = (group, options) => [['all', 'Tất cả'], ...options].map(([value, label]) =>
    `<button class="pill" type="button" data-group="${group}" data-value="${value}" aria-pressed="${value === 'all'}">${label}</button>`).join('');

  document.getElementById('filter-cuisine').innerHTML =
    pills('cuisine', Object.entries(FOOD.CUISINES).map(([k, c]) => [k, c.name]));
  document.getElementById('filter-meal').innerHTML =
    pills('meal', Object.entries(FOOD.MEALS).map(([k, m]) => [k, m.label]));

  function render() {
    const dishes = FOOD.DISHES.filter((d) =>
      (filters.cuisine === 'all' || d.cuisine === filters.cuisine) &&
      (filters.meal === 'all' || d.meals.includes(filters.meal)));

    count.textContent = `(${dishes.length})`;
    grid.innerHTML = dishes.map((d) => {
      const meals = d.meals.map((m) => FOOD.MEALS[m].label).join(', ');
      return `<li><a class="dish" data-cuisine="${d.cuisine}" href="${App.dishUrl(d)}">
        <span class="dish__photo"><img src="${App.photo(d, 560, 420)}" alt="${d.name}" width="560" height="420" loading="lazy"></span>
        <span class="dish__name">${d.name}</span>
        <span class="dish__meta">${FOOD.CUISINES[d.cuisine].name} · ${meals}</span>
      </a></li>`;
    }).join('');
  }

  document.querySelector('.filters').addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    filters[pill.dataset.group] = pill.dataset.value;
    document.querySelectorAll(`.pill[data-group="${pill.dataset.group}"]`).forEach((p) =>
      p.setAttribute('aria-pressed', p === pill));
    render();
  });

  render();
})();
