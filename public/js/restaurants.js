/* Directory backed by the read-only MVC API, preserving spreadsheet provenance. */
(() => {
  const $ = id => document.getElementById(id);
  const grid = $('restaurant-grid');
  const dialog = $('restaurant-detail');
  const controls = [$('restaurant-query'), $('restaurant-category'), $('restaurant-meal'), $('restaurant-price')];
  const initial = new URLSearchParams(location.search);
  let page = Math.max(1, Number(initial.get('page')) || 1);
  let totalPages = 1;
  let request;
  let detailRequest;
  let detailOpener;
  let facetsReady = false;
  let openInitialDetail = true;
  let dishFilter = initial.get('dish') || '';
  const dishName = FOOD.DISHES.find(d => d.id === dishFilter)?.name;
  if (dishName) $('restaurant-dish-filter').textContent = `Quán liên quan đến ${dishName} · Đà Nẵng`;
  $('restaurant-dish-filter').hidden = !dishName;
  const { make, safeLink, external, photo, mapsUrl } = RestaurantUI;
  const dropdowns = [];
  const mealKeys = { Sáng: 'sang', Trưa: 'trua', Chiều: 'chieu', Tối: 'toi', Khuya: 'khuya' };
  const svg = path => `<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const categoryPaths = {
    'Món chính': '<path d="M3 12h18M5 12a7 7 0 0 1 14 0M12 3v2M3 16h18"/>',
    'Ăn vặt': '<path d="m5 4 14 16M4 11l7-7M13 20l7-7M7 7l3 3M14 14l3 3"/>',
    'Cà phê & nước': '<path d="M4 8h12v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4ZM16 9h3a3 3 0 0 1 0 6h-3M8 2v3M12 2v3"/>',
    'Bánh': '<path d="M4 11h16v10H4ZM4 15h16M7 11V8h10v3M12 8V4M11 3h2"/>',
    'Ăn chay': '<path d="M20 4C8 2 3 9 7 15s13 1 13-11ZM4 21 15 10"/>',
    'Hải sản': '<path d="M5 12c6-10 14-4 16 0-2 4-10 10-16 0ZM5 12l-3-4v8ZM16 10v1"/>',
    'Fine dining': '<path d="M5 3v7M2 3v5q3 5 6 0V3M5 10v11M17 3v18M17 3q-7 8 0 10"/>',
    'Ăn sáng': '<path d="M3 17h18M5 13a7 7 0 0 1 14 0M12 2v3M3 6l2 2M21 6l-2 2"/>'
  };
  function populate(trigger, options, initialValue, kind, title) {
    const entries = [{ key: '', label: title, icon: kind === 'meal' ? App.mealIcon('trua') : svg(kind === 'price' ? '<circle cx="12" cy="12" r="9"/><path d="M15 7H9v10h6M7 14h10"/>' : categoryPaths['Món chính']) }, ...options.map(value => ({ key: kind === 'meal' ? mealKeys[value] : value, label: value, icon: kind === 'meal' ? App.mealIcon(mealKeys[value]) : svg(kind === 'price' ? '<circle cx="12" cy="12" r="9"/><path d="M15 7H9v10h6M7 14h10"/>' : categoryPaths[value]) }))];
    const dropdown = CatalogFilters.createDropdown(trigger, $(trigger.id + '-options'), entries, kind, title, () => { page = 1; load(); });
    dropdown.setValue(options.includes(initialValue) ? kind === 'meal' ? mealKeys[initialValue] : initialValue : '');
    dropdowns.push(dropdown);
  }
  const nutritionDropdown = Nutrition.setup('restaurant-nutrition', () => { page = 1; load(); });
  nutritionDropdown.setValue(Nutrition.entries.some(entry => entry.key === initial.get('nutrition')) ? initial.get('nutrition') : 'all');
  function queryParams() {
    const p = new URLSearchParams({ page: String(page), pageSize: '12' });
    ['q', 'category', 'meal', 'priceTier'].forEach((key, index) => {
      let value = (controls[index].value || '').trim();
      if (key === 'meal') value = Object.keys(mealKeys).find(label => mealKeys[label] === value) || '';
      if (value) p.set(key, value);
    });
    if ($('restaurant-nutrition').value !== 'all') p.set('nutrition', $('restaurant-nutrition').value);
    if (dishFilter) p.set('dish', dishFilter);
    return p;
  }
  async function load() {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    Nutrition.note($('restaurant-nutrition').value);
    grid.setAttribute('aria-busy', 'true');
    grid.replaceChildren();
    $('restaurant-error').hidden = true;
    $('restaurant-empty').hidden = true;
    $('restaurant-count').textContent = 'Đang tải địa điểm…';
    $('restaurant-prev').disabled = $('restaurant-next').disabled = true;
    $('restaurant-pages').textContent = $('restaurant-page-info').textContent = '';
    try {
      // Restore URL filters on the first request before the facet options exist.
      const params = facetsReady ? queryParams() : new URLSearchParams(initial);
      params.set('page', String(page));
      params.set('pageSize', '12');
      const response = await fetch(`/api/restaurants?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Không thể đọc dữ liệu địa điểm.');
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!facetsReady) {
        populate(controls[1], data.facets.categories, initial.get('category'), 'category', 'Mọi nhóm món');
        populate(controls[2], data.facets.meals, initial.get('meal'), 'meal', 'Mọi bữa ăn');
        populate(controls[3], data.facets.priceTiers, initial.get('priceTier'), 'price', 'Mọi mức giá');
        facetsReady = true;
      }
      page = data.page;
      totalPages = data.totalPages;
      grid.replaceChildren(...data.items.map(record => RestaurantUI.renderCard(record, openDetail)));
      $('restaurant-count').textContent = `${data.total} / ${data.totalRecords} địa điểm`;
      $('restaurant-empty').hidden = data.total > 0;
      $('restaurant-page-info').textContent = data.total ? `Hiển thị ${(page - 1) * data.pageSize + 1}–${Math.min(page * data.pageSize, data.total)}` : '';
      $('restaurant-pages').textContent = `Trang ${page} / ${totalPages}`;
      $('restaurant-prev').disabled = page <= 1;
      $('restaurant-next').disabled = page >= totalPages;
      const bookmark = queryParams();
      if (initial.get('restaurant')) bookmark.set('restaurant', initial.get('restaurant'));
      history.replaceState(null, '', `${location.pathname}?${bookmark}`);
      if (openInitialDetail && initial.get('restaurant')) {
        openInitialDetail = false;
        openDetail(initial.get('restaurant'), $('restaurant-search'));
      }
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      $('restaurant-error').hidden = false;
      $('restaurant-count').textContent = 'Danh sách chưa tải được';
      $('restaurant-error-message').textContent = location.protocol === 'file:' ? 'Chạy npm start và mở http://127.0.0.1:3000/restaurants.html để dùng API.' : 'Kiểm tra server đang chạy bằng npm start rồi thử lại nhé.';
    } finally {
      if (request === controller) grid.setAttribute('aria-busy', 'false');
    }
  }
  async function openDetail(id, opener) {
    detailRequest?.abort();
    const controller = new AbortController();
    detailRequest = controller;
    detailOpener = opener;
    const body = $('restaurant-detail-body');
    body.replaceChildren(make('h2', '', 'Đang tải thông tin…'));
    body.firstElementChild.id = 'restaurant-detail-name';
    dialog.showModal();
    $('restaurant-detail-close').focus();
    try {
      const response = await fetch(`/api/restaurants/${encodeURIComponent(id)}`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const record = await response.json();
      if (controller.signal.aborted) return;
      const content = make('div', 'restaurant-detail__content');
      const heading = make('h2', '', record.name);
      heading.id = 'restaurant-detail-name';
      const info = make('dl', 'restaurant-detail__facts');
      for (const [label, value] of [['Địa chỉ', record.address], ['Khu vực danh sách', record.area], ['Phân loại', record.originalCategory], ['Bữa gợi ý', record.suggestedMeals.join(', ')], ['Khoảng giá tham khảo', record.priceLabel]]) {
        info.append(make('dt', '', label), make('dd', '', value));
      }
      const actions = make('div', 'restaurant-detail__actions');
      actions.append(external('Tìm địa điểm trên Google Maps ↗', mapsUrl(record), 'btn btn--primary'));
      const fullPage = make('a', 'btn', 'Xem trang quán →');
      fullPage.href = 'restaurant.html?id=' + encodeURIComponent(record.id);
      actions.append(fullPage);
      if (safeLink(record.website)) actions.append(external('Website quán ↗', safeLink(record.website), 'btn'));
      const note = make('p', 'restaurant-detail__note', 'Giá và thực đơn có thể thay đổi. Chưa có liên kết đặt món trực tiếp. Vui lòng kiểm tra lại trước khi ghé.');
      const source = make('p', 'restaurant-detail__source');
      const photoSource = record.photo.kind === 'admin-provided' ? 'Ảnh do quản trị viên cung cấp' : record.photo.kind === 'official-page' ? record.photo.sourceLabel : 'Ảnh minh họa · Unsplash';
      if (safeLink(record.photo.sourceUrl)) source.append(external(`${photoSource} ↗`, safeLink(record.photo.sourceUrl)));
      content.append(make('p', 'restaurant-card__category', record.category), heading, info, actions, note, source);
      body.replaceChildren(photo(record), content);
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      const heading = make('h2', '', 'Chưa tải được địa điểm');
      heading.id = 'restaurant-detail-name';
      body.replaceChildren(heading, make('p', '', 'Đóng cửa sổ rồi thử lại nhé.'));
    }
  }
  let searchTimer;
  controls[0].addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page = 1; load(); }, 250); });
  controls[0].value = initial.get('q') || '';
  $('restaurant-search').addEventListener('submit', event => { event.preventDefault(); page = 1; load(); });
  controls.slice(1).forEach(select => select.addEventListener('change', () => { page = 1; load(); }));
  function reset() {
    clearTimeout(searchTimer);
    controls.forEach(control => { control.value = ''; });
    dropdowns.forEach(dropdown => { dropdown.close(); dropdown.setValue(''); });
    nutritionDropdown.close();
    nutritionDropdown.setValue('all');
    dishFilter = '';
    $('restaurant-dish-filter').hidden = true;
    [...initial.keys()].forEach(key => initial.delete(key));
    page = 1;
    load();
  }
  $('restaurant-reset').addEventListener('click', reset);
  $('restaurant-empty-reset').addEventListener('click', reset);
  $('restaurant-retry').addEventListener('click', load);
  $('restaurant-prev').addEventListener('click', () => { if (page > 1) { page--; load(); } });
  $('restaurant-next').addEventListener('click', () => { if (page < totalPages) { page++; load(); } });
  $('restaurant-detail-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { detailRequest?.abort(); detailOpener?.focus(); });
  load();
})();
