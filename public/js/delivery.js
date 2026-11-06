/* Frontend handoff only: region does not set platform delivery location. */
(() => {
  const $ = id => document.getElementById(id);
  const dialog = $('delivery-dialog');
  const input = $('delivery-region');
  const storageKey = 'hnag:legacy-delivery-region';
  const platforms = {
    grab: { name: 'GrabFood', url: 'https://food.grab.com/vn/vi/', domain: 'food.grab.com', logo: 'images/brands/grabfood-green.png' },
    shopee: { name: 'ShopeeFood', url: 'https://shopeefood.vn/', domain: 'shopeefood.vn', logo: 'images/brands/shopeefood.png' },
  };
  let platform;
  let dish;
  let selectedRegion;
  let opener;
  let copyVersion = 0;
  const normalize = value => value.trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const findRegion = value => LEGACY_REGIONS.find(name => normalize(name) === normalize(value));
  const sortedRegions = [...LEGACY_REGIONS].sort((a, b) => a.localeCompare(b, 'vi'));
  for (const name of sortedRegions) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    input.append(option);
  }

  function updateRegion() {
    copyVersion++;
    selectedRegion = findRegion(input.value);
    $('delivery-continue').disabled = !selectedRegion;
    $('delivery-query-section').hidden = !selectedRegion;
    $('delivery-web-search').hidden = !selectedRegion;
    $('delivery-feedback').textContent = '';
    $('delivery-continue').textContent = `Mở ${platform.name} để tìm món ↗`;
    $('delivery-guidance').textContent = selectedRegion
      ? `Bạn đã chọn ${selectedRegion}. Khi mở ${platform.name}, hãy chọn địa chỉ tại khu vực này rồi tìm “${dish.name}”.`
      : 'Chọn một tỉnh/thành trong danh sách để tiếp tục.';
    if (selectedRegion) {
      $('delivery-query').value = dish.name;
      const query = `site:${platform.domain} ${dish.name} ${selectedRegion}`;
      $('delivery-web-search').href = `https://www.google.com/search?${new URLSearchParams({ q: query })}`;
      $('delivery-web-search').textContent = `Tìm ${dish.name} tại ${selectedRegion} trên web ↗`;
    } else {
      $('delivery-query').value = '';
      $('delivery-web-search').removeAttribute('href');
    }
  }

  document.querySelectorAll('[data-delivery]').forEach(link => {
    link.addEventListener('click', event => {
      // Preserve native open-in-new-tab behavior for modified clicks.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if ($('result').hasAttribute('aria-busy')) return;
      dish = FOOD.DISHES.find(item => item.id === $('result').dataset.dishId);
      if (!dish) return;
      platform = platforms[link.dataset.delivery];
      opener = link;
      $('delivery-dialog-logo').src = platform.logo;
      $('delivery-dialog-logo').alt = platform.name;
      $('delivery-dialog-title').textContent = `Tìm ${dish.name} ở đâu?`;
      $('delivery-dialog-description').textContent = `Chọn khu vực bạn muốn tìm món qua ${platform.name}.`;
      try { input.value = findRegion(localStorage.getItem(storageKey) || '') || ''; }
      catch { input.value = ''; }
      updateRegion();
      dialog.showModal();
      input.focus();
    });
  });
  input.addEventListener('change', updateRegion);
  $('delivery-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { copyVersion++; opener?.focus(); });
  $('delivery-region-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!selectedRegion) return input.focus();
    try { localStorage.setItem(storageKey, selectedRegion); } catch { /* Storage is optional. */ }
    window.open(platform.url, '_blank', 'noopener,noreferrer');
    $('delivery-feedback').textContent = `Nếu tab mới chưa mở, hãy cho phép mở tab và bấm lại. Trên ${platform.name}, chọn địa chỉ tại ${selectedRegion} và tìm “${dish.name}”.`;
  });
  $('delivery-web-search').addEventListener('click', () => {
    if (selectedRegion) {
      try { localStorage.setItem(storageKey, selectedRegion); } catch { /* Optional. */ }
    }
  });
  $('delivery-copy').addEventListener('click', async () => {
    if (!selectedRegion) return;
    const version = copyVersion;
    try {
      await navigator.clipboard.writeText(dish.name);
      if (version === copyVersion) $('delivery-feedback').textContent = 'Đã sao chép tên món. Dán vào ô tìm kiếm trên nền tảng nhé.';
    } catch {
      if (version !== copyVersion) return;
      $('delivery-query').focus();
      $('delivery-query').select();
      $('delivery-feedback').textContent = 'Hãy sao chép tên món trong ô đã chọn bằng Ctrl+C hoặc thao tác sao chép trên thiết bị.';
    }
  });
})();
