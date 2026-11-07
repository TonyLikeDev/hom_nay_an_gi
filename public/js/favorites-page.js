(() => {
  const $ = id => document.getElementById(id);
  let tab = 'all'; let sequence = 0;
  const { make } = RestaurantUI;
  async function render() {
    const version = ++sequence;
    const state = Favorites.read();
    const focused = document.activeElement;
    const returningFocus = focused?.matches('[data-favorite-id]') && Boolean(focused.closest('main'));
    $('favorite-dish-count').textContent = '(' + state.dishes.length + ')';
    $('favorite-restaurant-count').textContent = '(' + state.restaurants.length + ')';
    $('favorite-dishes-section').hidden = tab === 'restaurants' || !state.dishes.length;
    $('favorite-restaurants-section').hidden = tab === 'dishes' || !state.restaurants.length;
    const count = (tab !== 'restaurants' ? state.dishes.length : 0) + (tab !== 'dishes' ? state.restaurants.length : 0);
    $('favorites-empty').hidden = count > 0;
    $('favorites-status').textContent = count ? count + ' mục đã lưu' : '';
    $('favorite-dishes').replaceChildren(...state.dishes.map(id => {
      const dish = FOOD.DISHES.find(item => item.id === id);
      const li = make('li'); const article = make('article', 'dish');
      if (!dish) { article.append(make('p', '', 'Món hiện chưa có trong danh mục công khai')); article.insertAdjacentHTML('beforeend', Favorites.button('dishes', id, 'món đã lưu', true)); }
      else {
        const photo = make('span', 'dish__photo'); const image = make('img'); image.src = App.photo(dish, 560, 420); image.alt = dish.name; image.width = 560; image.height = 420; image.loading = 'lazy'; photo.append(image);
        const heading = make('span', 'dish__heading'); const link = make('a', 'dish__name dish__main-link', dish.name); link.href = App.dishUrl(dish); heading.append(link); heading.insertAdjacentHTML('beforeend', Nutrition.vegetarianBadge(dish) + Nutrition.badges(dish));
        const meta = make('span', 'dish__meta'); meta.innerHTML = App.cuisineLabel(dish.cuisine);
        article.append(photo, heading, meta);
        if (RECIPES[dish.id]) { const recipe = make('a', 'dish__recipe-link', 'Xem công thức →'); recipe.href = 'recipe.html?dish=' + encodeURIComponent(dish.id); article.append(recipe); } article.insertAdjacentHTML('beforeend', Nutrition.scope(dish) + Favorites.button('dishes', id, dish.name));
      }
      li.append(article); return li;
    }));
    if (returningFocus) document.querySelector('[data-favorite-tab][aria-pressed="true"]').focus({ preventScroll: true });
    $('favorites-retry').hidden = true;
    if (tab === 'dishes' || !state.restaurants.length) return;
    $('favorite-restaurants-status').textContent = 'Đang tải quán đã lưu…';
    const items = await Promise.allSettled(state.restaurants.map(async id => {
      const response = await fetch('/api/restaurants/' + encodeURIComponent(id));
      if (response.status === 404) return { id, missing: true };
      if (!response.ok) throw new Error('load'); return response.json();
    }));
    if (version !== sequence) return;
    const records = items.flatMap((result, i) => {
      if (result.status === 'fulfilled' && !result.value.missing) return [RestaurantUI.renderCard(result.value)];
      const li = make('li', 'favorite-unavailable');
      li.append(make('p', '', result.status === 'fulfilled' ? 'Quán hiện chưa có trong danh mục công khai' : 'Chưa tải được thông tin quán đã lưu'));
      li.insertAdjacentHTML('beforeend', Favorites.button('restaurants', state.restaurants[i], 'quán đã lưu', true)); return [li];
    });
    $('favorite-restaurants').replaceChildren(...records);
    const failed = items.some(item => item.status === 'rejected');
    $('favorite-restaurants-status').textContent = failed ? 'Một số quán chưa tải được. Danh sách đã lưu vẫn được giữ.' : '';
    $('favorites-retry').hidden = !failed;
  }
  document.querySelectorAll('[data-favorite-tab]').forEach(button => button.addEventListener('click', () => {
    tab = button.dataset.favoriteTab;
    document.querySelectorAll('[data-favorite-tab]').forEach(item => item.setAttribute('aria-pressed', String(item === button))); render();
  }));
  $('favorites-retry').addEventListener('click', render);
  document.addEventListener('favoriteschange', render);
  render();
})();
