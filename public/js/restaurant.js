/* Frontend detail page: uses existing read-only endpoints, with no invented menu fields. */
(() => {
  const $ = id => document.getElementById(id);
  const { make, photo, mapsUrl, safeLink, external } = RestaurantUI;
  const id = new URLSearchParams(location.search).get('id');
  let request;
  async function json(url, signal) {
    const response = await fetch(url, { signal });
    if (!response.ok) { const error = new Error('Request failed'); error.status = response.status; throw error; }
    return response.json();
  }
  function showError(missing) {
    $('venue-content').hidden = true;
    $('venue-status').hidden = true;
    $('venue-error').hidden = false;
    $('venue-error-title').textContent = missing ? 'Chưa tìm thấy địa điểm này' : 'Chưa tải được thông tin quán';
    $('venue-error-text').textContent = missing ? 'Đường dẫn có thể thiếu hoặc sai mã địa điểm. Bạn có thể quay lại danh sách để chọn quán khác.' : 'Kết nối đang gặp sự cố. Bạn thử tải lại thông tin nhé.';
    $('venue-retry').hidden = missing;
    document.title = (missing ? 'Không tìm thấy quán' : 'Chưa tải được quán') + ' | Hôm nay ăn gì?';
  }
  function render(record) {
    document.title = record.name + ' | Hôm nay ăn gì?';
    $('venue-name').textContent = $('venue-breadcrumb-name').textContent = record.name;
    $('venue-category').textContent = record.category;
    $('venue-address').textContent = [record.address, record.area].filter(Boolean).join(' · ');
    $('venue-save')?.remove();
    const save = make('div'); save.id = 'venue-save'; save.innerHTML = Favorites.button('restaurants', record.id, record.name, true); $('venue-category').after(save);
    const figure = photo(record);
    figure.querySelector('img').loading = 'eager';
    $('venue-photo').replaceChildren(figure);
    const keys = { Sáng: 'sang', Trưa: 'trua', Chiều: 'chieu', Tối: 'toi', Khuya: 'khuya' };
    $('venue-meals').replaceChildren(...record.suggestedMeals.map(meal => {
      const tag = make('span', 'meal-tag');
      if (keys[meal]) tag.innerHTML = App.mealIcon(keys[meal]);
      tag.append(document.createTextNode(meal));
      return tag;
    }));
    $('venue-actions').replaceChildren(external('Tìm địa điểm trên Maps ↗', mapsUrl(record), 'btn btn--primary'));
    if (safeLink(record.website)) $('venue-actions').append(external('Website quán ↗', record.website, 'btn'));
    const facts = $('venue-facts');
    facts.replaceChildren();
    const fact = (label, value) => facts.append(make('dt', '', label), make('dd', '', value));
    fact('Khoảng giá tham khảo', record.priceLabel || 'Chưa có thông tin');
    fact('Giờ mở cửa', record.hours || 'Chưa có thông tin được xác nhận');
    fact('Liên hệ', record.phone || 'Chưa có số điện thoại được xác nhận');
    const source = $('venue-source');
    source.replaceChildren(make('p', '', record.photo.kind === 'admin-provided' ? 'Ảnh do quản trị viên cung cấp; chưa được đối chiếu độc lập.' : record.photo.kind === 'official-page' ? 'Ảnh từ website chính thức; không xác nhận hiện trạng địa điểm.' : 'Ảnh minh họa, không phải ảnh xác nhận của quán.'));
    if (safeLink(record.photo.sourceUrl)) source.append(external(record.photo.kind === 'admin-provided' ? 'Nguồn ảnh được cung cấp ↗' : record.photo.kind === 'official-page' ? 'Xem nguồn ảnh ↗' : 'Nguồn ảnh · Unsplash ↗', record.photo.sourceUrl));
    $('venue-content').hidden = false;
    $('venue-status').hidden = true;
  }
  async function dishes(record, signal) {
    $('venue-dishes').replaceChildren();
    $('venue-dishes-note').textContent = 'Đang đối chiếu món liên quan…';
    const linked = FOOD.DISHES.filter(dish => dish.source?.restaurantIds?.includes(record.id)).map(dish => ({ dish, offering: dish.name }));
    // Earlier catalog dishes do not carry restaurantIds; query only those with known direct links.
    const original = FOOD.DISHES.filter(dish => !dish.source?.restaurantIds && dish.linkedRestaurantCount > 0);
    const results = await Promise.allSettled(original.map(async dish => {
      const data = await json('/api/dishes/' + encodeURIComponent(dish.id) + '/restaurants', signal);
      const match = data.matches.find(item => item.id === record.id);
      return match ? { dish, offering: match.dishMatch.offering } : null;
    }));
    if (signal.aborted) return;
    results.forEach(result => { if (result.status === 'fulfilled' && result.value) linked.push(result.value); });
    const unique = [...new Map(linked.map(item => [item.dish.id, item])).values()];
    $('venue-dishes-note').textContent = 'Món liên quan theo danh mục hiện có; chưa phải thực đơn đầy đủ hoặc xác nhận còn bán. Chưa có giá riêng cho từng món. Ảnh món là ảnh minh họa.';
    $('venue-dishes-error').hidden = !results.some(result => result.status === 'rejected');
    $('venue-dishes-empty').hidden = unique.length > 0 || !$('venue-dishes-error').hidden;
    unique.forEach(({ dish, offering }) => {
      const li = make('li', 'venue-dish');
      const image = make('img');
      image.src = App.photo(dish, 400, 300); image.alt = ''; image.width = 400; image.height = 300; image.loading = 'lazy';
      image.addEventListener('error', () => { image.src = '/images/restaurants/placeholder.svg'; }, { once: true });
      const content = make('div', 'venue-dish__content');
      const heading = make('h3');
      const link = make('a', 'venue-dish__link', dish.name);
      link.href = App.dishUrl(dish); heading.append(link);
      const meta = make('p', 'venue-dish__meta'); meta.innerHTML = App.cuisineLabel(dish.cuisine);
      const badges = make('div', 'venue-dish__badges'); badges.innerHTML = Nutrition.vegetarianBadge(dish);
      // Nutrition of a reference recipe must not imply a claim about a restaurant serving.
      content.append(heading, meta);
      if (offering !== dish.name) content.append(make('p', 'venue-dish__offering', offering));
      if (badges.childElementCount) content.append(badges);
      content.append(make('span', 'venue-dish__hint', 'Khám phá món →'));
      li.append(image, content); $('venue-dishes').append(li);
    });
  }
  async function related(record, signal) {
    try {
      const data = await json('/api/restaurants?' + new URLSearchParams({ category: record.category, pageSize: '4' }), signal);
      if (signal.aborted) return;
      const items = data.items.filter(item => item.id !== record.id).slice(0, 3);
      $('venue-related-grid').replaceChildren(...items.map(item => RestaurantUI.renderCard(item, undefined, 'h3')));
      $('venue-related-note').textContent = 'Cùng nhóm ' + record.category.toLocaleLowerCase('vi') + ' trong danh mục. Không phải gợi ý theo khoảng cách.';
      $('venue-related').hidden = !items.length;
    } catch { /* The main venue remains usable if optional recommendations fail. */ }
  }
  async function load() {
    request?.abort();
    const controller = new AbortController(); request = controller;
    $('venue-error').hidden = true; $('venue-content').hidden = true; $('venue-related').hidden = true;
    $('venue-status').hidden = false;
    $('venue-status').textContent = 'Đang tải thông tin quán…';
    $('venue-dishes-empty').hidden = $('venue-dishes-error').hidden = true;
    if (!id || !/^[a-z0-9-]{1,100}$/.test(id)) return showError(true);
    try {
      const record = await json('/api/restaurants/' + encodeURIComponent(id), controller.signal);
      if (controller.signal.aborted) return;
      render(record);
      await Promise.all([dishes(record, controller.signal), related(record, controller.signal)]);
    } catch (error) { if (!controller.signal.aborted) showError(error.status === 404); }
  }
  $('venue-retry').addEventListener('click', load);
  load();
})();
