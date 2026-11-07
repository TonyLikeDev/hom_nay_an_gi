/* Trang Tất cả món ăn: lưới món và bộ lọc theo ẩm thực, bữa ăn. */
(() => {
  const grid = document.getElementById('dish-grid');
  const empty = document.getElementById('empty');
  const count = document.getElementById('count');
  const filters = { cuisine: 'all', meal: 'all', diet: 'all', linked: 'all', nutrition: 'all', recipe: 'all' };
  const search = document.getElementById('dish-search');
  const normalize = value => value.trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const leafIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4c-6-1-13 1-14 7-1 4 2 7 6 6 6-1 8-7 8-13Z"/><path d="M4 21 15 10"/></svg>';
  const isVegetarian = App.isVegetarian;

  const cuisineSelect = document.getElementById('filter-cuisine');
  const mealSelect = document.getElementById('filter-meal');
  const dietToggle = document.getElementById('filter-diet');
  const linkedToggle = document.getElementById('filter-linked');
  const recipeToggle = document.getElementById('filter-recipe');
  const hasRecipe = dish => Object.hasOwn(RECIPES, dish.id);
  const clearButton = document.getElementById('catalog-clear');
  const globe = '<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>';
  const dropdowns = [];
  const createDropdown = (...args) => { const dropdown = CatalogFilters.createDropdown(...args); dropdowns.push(dropdown); return dropdown; };
  const cuisineEntries = [{ key: 'all', label: 'Mọi ẩm thực', icon: globe }, ...Object.entries(FOOD.CUISINES).map(([key, cuisine]) => {
    const label = document.createElement('span');
    label.innerHTML = App.cuisineLabel(key);
    return { key, label: cuisine.name, icon: label.firstElementChild.outerHTML };
  })];
  const mealEntries = [{ key: 'all', label: 'Mọi bữa ăn', icon: App.mealIcon('trua') }, ...Object.entries(FOOD.MEALS).map(([key, meal]) => ({ key, label: meal.label, icon: App.mealIcon(key) }))];
  const cuisineDropdown = createDropdown(cuisineSelect, document.getElementById('filter-cuisine-options'), cuisineEntries, 'cuisine', 'Ẩm thực', value => { filters.cuisine = value; render(); });
  const mealDropdown = createDropdown(mealSelect, document.getElementById('filter-meal-options'), mealEntries, 'meal', 'Bữa ăn', value => { filters.meal = value; render(); });
  document.addEventListener('pointerdown', event => {
    if (!cuisineSelect.parentElement.contains(event.target)) cuisineDropdown.close();
    if (!mealSelect.parentElement.contains(event.target)) mealDropdown.close();
  });
  const nutritionDropdown = Nutrition.setup('filter-nutrition', value => { filters.nutrition = value; render(); });
  dropdowns.push(nutritionDropdown);
  function updateControls() {
    nutritionDropdown.setValue(filters.nutrition);
    Nutrition.note(filters.nutrition);
    cuisineDropdown.setValue(filters.cuisine);
    mealDropdown.setValue(filters.meal);
    cuisineSelect.parentElement.dataset.cuisine = filters.cuisine;
    cuisineSelect.parentElement.dataset.active = String(filters.cuisine !== 'all');
    mealSelect.parentElement.dataset.meal = filters.meal;
    mealSelect.parentElement.dataset.active = String(filters.meal !== 'all');
    dietToggle.setAttribute('aria-pressed', String(filters.diet === 'vegetarian'));
    linkedToggle.setAttribute('aria-pressed', String(filters.linked === 'available'));
    recipeToggle.setAttribute('aria-pressed', String(filters.recipe === 'available'));
    const active = Object.values(filters).filter(value => value !== 'all').length + Number(Boolean(search.value.trim()));
    clearButton.hidden = active === 0;
    clearButton.textContent = 'Xóa lọc (' + active + ')';
    const icon = document.getElementById('catalog-cuisine-icon');
    if (filters.cuisine === 'all') icon.innerHTML = globe;
    else {
      const label = document.createElement('span');
      label.innerHTML = App.cuisineLabel(filters.cuisine);
      icon.replaceChildren(label.firstElementChild);
    }
    document.getElementById('catalog-meal-icon').innerHTML = App.mealIcon(filters.meal === 'all' ? 'trua' : filters.meal);
  }

  function render() {
    updateControls();
    const dishes = FOOD.DISHES.filter((d) =>
      Nutrition.matches(d, filters.nutrition) &&
      (filters.cuisine === 'all' || d.cuisine === filters.cuisine) &&
      (filters.meal === 'all' || d.meals.includes(filters.meal)) &&
      (filters.diet === 'all' || isVegetarian(d)) &&
      (filters.linked === 'all' || d.linkedRestaurantCount > 0) &&
      (filters.recipe === 'all' || hasRecipe(d)) &&
      (!search.value.trim() || normalize(d.name).includes(normalize(search.value))));

    count.textContent = `(${dishes.length})`;
    empty.hidden = dishes.length > 0;
    document.getElementById('diet-note').hidden = filters.diet !== 'vegetarian';
    grid.innerHTML = dishes.map((d) => {
      const meals = d.meals.map(m => `<span class="meal-tag">${App.mealIcon(m)}<span>${FOOD.MEALS[m].label}</span></span>`).join('');
      return `<li><article class="dish" data-cuisine="${d.cuisine}">
        <span class="dish__photo"><img src="${App.photo(d, 560, 420)}" alt="${d.name}" width="560" height="420" loading="lazy">${d.source?.type === 'restaurant-catalog' ? '<span class="dish__image-note">Ảnh minh họa</span>' : ''}</span>
        ${Favorites.button('dishes', d.id, d.name)}<span class="dish__heading"><a class="dish__name dish__main-link" href="${App.dishUrl(d)}">${d.name}</a>${Nutrition.badges(d)}${Nutrition.vegetarianBadge(d)}</span>
        ${Nutrition.scope(d)}
        <span class="dish__meta">${App.cuisineLabel(d.cuisine)}</span>
        <span class="dish__meals" role="group" aria-label="Bữa ăn phù hợp">${meals}</span>
        ${d.linkedRestaurantCount ? `<span class="dish__linked">${d.linkedRestaurantCount} địa điểm liên quan <span aria-hidden="true">→</span></span>` : ''}
        ${hasRecipe(d) ? `<a class="dish__recipe-link" href="recipe.html?dish=${d.id}">Xem công thức →</a>` : ''}
      </article></li>`;
    }).join('');
  }

  dietToggle.addEventListener('click', () => { filters.diet = filters.diet === 'all' ? 'vegetarian' : 'all'; render(); });
  linkedToggle.addEventListener('click', () => { filters.linked = filters.linked === 'all' ? 'available' : 'all'; render(); });
  recipeToggle.addEventListener('click', () => { filters.recipe = filters.recipe === 'all' ? 'available' : 'all'; render(); });
  function resetFilters() {
    search.value = '';
    Object.keys(filters).forEach(key => { filters[key] = 'all'; });
    dropdowns.forEach(dropdown => dropdown.close());
    render();
  }
  document.getElementById('clear-filters').addEventListener('click', resetFilters);
  clearButton.addEventListener('click', resetFilters);
  search.addEventListener('input', render);
  document.getElementById('dish-search-form').addEventListener('submit', event => { event.preventDefault(); render(); });

  render();
})();
