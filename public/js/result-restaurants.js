/* Load only after a dish settles. Abort old results before every new spin. */
(() => {
  const $ = id => document.getElementById(id);
  const section = $('result-restaurants');
  const grid = $('result-restaurants-grid');
  let request;
  let currentDish;
  function clear() {
    request?.abort();
    currentDish = null;
    section.hidden = true;
    grid.replaceChildren();
  }
  async function load(dishId) {
    request?.abort();
    const controller = new AbortController();
    request = controller;
    currentDish = dishId;
    const dish = FOOD.DISHES.find(d => d.id === dishId);
    if (!dish) return clear();
    section.hidden = false;
    grid.replaceChildren();
    grid.setAttribute('aria-busy', 'true');
    $('result-restaurants-empty').hidden = true;
    $('result-restaurants-retry').hidden = true;
    $('result-restaurants-title').textContent = `Thưởng thức ${dish.name} ở đâu?`;
    $('result-restaurants-description').textContent = 'Địa điểm tại Đà Nẵng · Giá và thực đơn cần kiểm tra lại trước khi ghé.';
    $('result-restaurants-status').textContent = 'Đang tìm quán liên quan…';
    $('result-restaurants-all').href = `restaurants.html?${new URLSearchParams({ dish: dishId })}`;
    $('result-restaurants-all').textContent = 'Xem tất cả quán liên quan →';
    $('result-restaurants-maps').href = App.mapsUrl(dish);
    try {
      const response = await fetch(`/api/dishes/${encodeURIComponent(dishId)}/restaurants`, { signal: controller.signal });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (controller.signal.aborted || currentDish !== dishId) return;
      const hasExact = data.matches.length > 0;
      const items = hasExact ? data.matches : data.related;
      $('result-restaurants-status').textContent = hasExact
        ? `${data.matches.length} địa điểm có thông tin món phù hợp. Biến thể và phần ăn có thể khác nhau.`
        : items.length ? 'Các quán dưới đây có món cùng nhóm, chưa xác nhận bán đúng món vừa chọn.' : '';
      if (!hasExact) {
        $('result-restaurants-empty').hidden = false;
        $('result-restaurants-empty-title').textContent = `Chưa có thông tin quán bán ${dish.name}`;
        $('result-restaurants-empty-text').textContent = items.length
          ? 'Bạn có thể tham khảo các quán cùng nhóm bên dưới và kiểm tra thực đơn trước khi đặt.'
          : 'Danh sách hiện tại chưa có thông tin phù hợp. Bạn có thể tìm món trên Google Maps hoặc khám phá địa điểm khác.';
      }
      grid.replaceChildren(...items.slice(0, 3).map(record => RestaurantUI.renderCard(record, undefined, 'h3')));
      if (!items.length) {
        $('result-restaurants-all').href = 'restaurants.html';
        $('result-restaurants-all').textContent = 'Khám phá các quán khác →';
      }
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      $('result-restaurants-status').textContent = 'Chưa tải được gợi ý quán. Bạn vẫn có thể tìm món trên Maps hoặc thử lại.';
      $('result-restaurants-retry').hidden = false;
      $('result-restaurants-empty').hidden = false;
      $('result-restaurants-empty-title').textContent = 'Tiếp tục tìm món';
      $('result-restaurants-empty-text').textContent = 'Thông tin quán chưa tải được, không có nghĩa là không có quán bán món này.';
    } finally {
      if (request === controller) grid.setAttribute('aria-busy', 'false');
    }
  }
  document.addEventListener('dishselected', event => load(event.detail.dishId));
  document.addEventListener('dishspinstart', clear);
  $('result-restaurants-retry').addEventListener('click', () => { if (currentDish) load(currentDish); });
})();
