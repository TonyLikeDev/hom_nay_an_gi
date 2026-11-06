/* Only explicit, sourced review metadata may create nutrition badges. */
const Nutrition = (() => {
  const svg = path => `<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  const entries = [
    { key: 'all', label: 'Ăn kiêng', icon: svg('<path d="M12 3v18M5 7h14M5 17h14"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>') },
    { key: 'low-sugar', label: 'Ít đường', icon: svg('<path d="m12 3 8 5v9l-8 4-8-4V8ZM4 8l8 5 8-5M12 13v8M4 3l16 18"/>') },
    { key: 'low-carb', label: 'Ít tinh bột', icon: svg('<path d="M12 21V5M12 9C5 9 5 4 5 4s7 0 7 5ZM12 14c7 0 7-5 7-5s-7 0-7 5ZM12 19c-7 0-7-5-7-5s7 0 7 5M4 3l16 18"/>') },
    { key: 'low-energy', label: 'Ít năng lượng', icon: svg('<path d="M13 2 5 14h6l-1 8 9-13h-6Z"/>') }
  ];
  const tags = record => entries.slice(1).filter(entry => record.nutritionReviews?.some(review => review.key === entry.key && review.status === 'verified' && review.source && review.basis));
  const matches = (record, key) => key === 'all' || tags(record).some(entry => entry.key === key);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const scope = record => record.nutritionProfile ? `<span class="nutrition-scope">${escape(record.nutritionProfile.scope)}</span>` : '';
  const records = new Map();
  const badges = record => {
    if (record.id && record.nutritionProfile) records.set(record.id, record);
    return tags(record).map(entry => {
      const interactive = Boolean(record.id && record.nutritionProfile);
      const attributes = interactive ? `type="button" data-nutrition-dish="${escape(record.id)}" aria-haspopup="dialog" aria-controls="nutrition-dialog" aria-label="${escape(entry.label + ' — xem dinh dưỡng của ' + record.name)}"` : '';
      const tag = interactive ? 'button' : 'span';
      return `<${tag} class="nutrition-badge" data-nutrition="${entry.key}" ${attributes}>${entry.icon}${entry.label}${record.nutritionProfile ? '*' : ''}</${tag}>`;
    }).join('');
  };
  let dialog;
  let opener;
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };
  function sourceLink(label, url) {
    try {
      if (new URL(url).protocol !== 'https:') return null;
      const link = make('a', 'nutrition-dialog__source', label + ' ↗');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      return link;
    } catch { return null; }
  }
  const leaf = svg('<path d="M20 4c-6-1-13 1-14 7-1 4 2 7 6 6 6-1 8-7 8-13Z"/><path d="M4 21 15 10"/>');
  const vegetarianBadge = record => App.isVegetarian(record) ? `<button type="button" class="vegetarian-badge dish__diet" data-vegetarian-dish="${escape(record.id)}" aria-haspopup="dialog" aria-controls="nutrition-dialog" aria-label="${escape('Ăn chay — xem nguyên liệu và xác minh của ' + record.name)}">${leaf} Ăn chay</button>` : '';
  function vegetarianBody(body, record) {
    const review = record.vegetarianReview;
    const reviewed = review.status === 'reviewed';
    const label = make('p', 'nutrition-dialog__label');
    label.innerHTML = leaf;
    label.append(document.createTextNode(reviewed ? 'Ăn chay · đã rà soát phiên bản công thức' : 'Ăn chay · theo thông tin danh mục'));
    const condition = make('p', '', review.scope);
    condition.id = 'nutrition-dialog-scope';
    body.append(label, make('h3', '', 'Mức độ xác minh'), condition);
    body.append(make('h3', '', 'Nguyên liệu'));
    if (review.ingredients?.length) {
      const ingredients = make('ul', 'vegetarian-dialog__ingredients');
      review.ingredients.forEach(ingredient => ingredients.append(make('li', '', ingredient)));
      body.append(ingredients);
    } else {
      body.append(make('p', '', 'Chưa có danh sách nguyên liệu đầy đủ từ quán. Không suy đoán nhân, nước dùng hay nước chấm từ tên món.'));
    }
    body.append(make('h3', '', 'Điều kiện áp dụng'));
    body.append(make('p', '', reviewed
      ? 'Chỉ áp dụng cho phiên bản nguyên liệu trên website: không thêm thịt, cá, hải sản, mỡ động vật, nước dùng thịt hoặc nước mắm cá. Chưa xác minh cách chế biến của từng quán.'
      : 'Món được gắn nhãn dựa trên tên món và nhóm món chay trong danh mục địa điểm; chưa phải xác minh độc lập hoặc chứng nhận từ quán. Khi gọi món, hãy hỏi lại toàn bộ thành phần.'));
    const checks = record.id === 'xoi-xoai'
      ? 'Kiểm tra kem dừa hoặc topping thêm vào: có thể chứa sữa, gelatin hay thành phần khác. Chọn phiên bản không có thành phần động vật nếu muốn dùng thuần chay.'
      : record.id === 'bruschetta'
        ? 'Kiểm tra bánh mì có mỡ động vật không; sốt và topping không thêm thịt, cá. Phô mai nếu dùng cần kiểm tra men đông và thành phần; phiên bản rà soát không thêm phô mai.'
        : 'Hỏi về nước dùng, nước mắm cá, mắm tôm, dầu hào, mỡ động vật và nhân món. Nếu kiêng trứng hoặc sữa, cần hỏi riêng bánh, sốt và topping.';
    body.append(make('p', 'nutrition-dialog__note', checks));
    body.append(make('h3', '', 'Nguồn thông tin'));
    if (reviewed) {
      const source = sourceLink('Công thức tham khảo', review.source);
      if (source) body.append(source);
      const recipe = make('a', 'nutrition-dialog__source', 'Xem phiên bản công thức trên website →');
      recipe.href = 'recipe.html?dish=' + encodeURIComponent(record.id);
      if(typeof RECIPES!=='undefined'&&Object.hasOwn(RECIPES,record.id))body.append(recipe);
      body.append(make('p', 'nutrition-dialog__note', 'Nguồn tham khảo chỉ áp dụng cho phiên bản đã đối chiếu; không phải xác nhận món tại quán.'));
      if (review.reviewedAt) body.append(make('p', 'nutrition-dialog__checked', 'Rà soát công thức: ' + review.reviewedAt.split('-').reverse().join('/')));
    } else {
      const suppliedSource=sourceLink('Nguồn thành phần đã đối chiếu',review.source);
      if(suppliedSource)body.append(suppliedSource);
      body.append(make('p', '', suppliedSource?'Nhãn dựa trên nguồn thành phần đã cung cấp; chưa phải xác minh độc lập hoặc chứng nhận món tại quán.':'Thông tin tên món và phân loại chay trong danh mục địa điểm của website. Chưa có đường dẫn công thức hay bảng thành phần được quán xác nhận.'));
      const venues = make('a', 'nutrition-dialog__source', 'Xem các địa điểm giới thiệu món này →');
      venues.href = 'restaurants.html?dish=' + encodeURIComponent(record.id);
      body.append(venues);
    }
    body.append(make('p', 'nutrition-dialog__note', 'Nhãn Ăn chay không đồng nghĩa thuần chay, không có chất gây dị ứng hoặc ít năng lượng. Hãy hỏi quán về dụng cụ và dầu chiên dùng chung nếu điều này quan trọng với bạn.'));
  }
  function open(record, key, trigger) {
    const profile = record.nutritionProfile;
    const vegetarian = key === 'vegetarian' && App.isVegetarian(record);
    const entry = tags(record).find(tag => tag.key === key);
    const review = record.nutritionReviews?.find(item => item.key === key && item.status === 'verified');
    if (!vegetarian && (!profile || !entry || !review)) return;
    if (!dialog) {
      dialog = make('dialog', 'nutrition-dialog');
      dialog.id = 'nutrition-dialog';
      dialog.setAttribute('aria-labelledby', 'nutrition-dialog-title');
      dialog.setAttribute('aria-describedby', 'nutrition-dialog-scope');
      document.body.append(dialog);
      dialog.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const targets = [...dialog.querySelectorAll('button:not([disabled]), a[href]')];
        const first = targets[0];
        const last = targets[targets.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      });
      dialog.addEventListener('close', () => {
        document.documentElement.classList.remove('nutrition-dialog-open');
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      });
    }
    opener = trigger;
    dialog.dataset.nutrition = key;
    const header = make('div', 'nutrition-dialog__header');
    const heading = make('h2', '', record.name);
    heading.id = 'nutrition-dialog-title';
    const close = make('button', 'nutrition-dialog__close', 'Đóng');
    close.type = 'button';
    close.addEventListener('click', () => dialog.close());
    header.append(heading, close);
    const body = make('div', 'nutrition-dialog__body');
    if (vegetarian) {
      vegetarianBody(body, record);
    } else {
    const label = make('p', 'nutrition-dialog__label');
    label.innerHTML = entry.icon;
    label.append(document.createTextNode(entry.label + ' · phiên bản tham khảo'));
    const conditionHeading = make('h3', '', 'Điều kiện áp dụng');
    const condition = make('p', '', profile.scope);
    condition.id = 'nutrition-dialog-scope';
    const facts = make('dl', 'nutrition-dialog__facts');
    const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value);
    const fact = (title, value) => facts.append(make('dt', '', title), make('dd', '', value));
    fact('Khẩu phần nguồn', profile.serving);
    fact('Năng lượng', number(profile.values.energyKcal) + ' kcal / khẩu phần');
    fact('Đường tổng', number(profile.values.sugarsG) + ' g / khẩu phần');
    fact('Carbohydrate', number(profile.values.carbohydrateG) + ' g / khẩu phần');
    const criteriaHeading = make('h3', '', 'Vì sao có nhãn này?');
    const basis = make('p', '', review.basis);
    const sourcesHeading = make('h3', '', 'Nguồn dinh dưỡng');
    body.append(label, conditionHeading, condition, facts, criteriaHeading, basis, sourcesHeading);
    const source = sourceLink(profile.sourceLabel, profile.source);
    if (source) body.append(source);
    const criterionSource = sourceLink('Tiêu chí đối chiếu · European Commission', review.criterionSource);
    if (criterionSource) body.append(criterionSource);
    body.append(make('p', 'nutrition-dialog__note', profile.dataNote));
    const checked = profile.checkedAt?.split('-').reverse().join('/');
    if (checked) body.append(make('p', 'nutrition-dialog__checked', 'Đối chiếu: ' + checked));
    body.append(make('p', 'nutrition-dialog__note', 'Chỉ áp dụng cho phiên bản trên, không xác nhận phần ăn tại quán. Ít đường không đồng nghĩa ít tinh bột hoặc ít năng lượng.'));
    }
    dialog.replaceChildren(header, body);
    dialog.showModal();
    document.documentElement.classList.add('nutrition-dialog-open');
    close.focus({ preventScroll: true });
  }
  if (typeof document !== 'undefined') document.addEventListener('click', event => {
    const vegetarianTrigger = event.target.closest('button[data-vegetarian-dish]');
    if (vegetarianTrigger) {
      const dish = FOOD.DISHES.find(record => record.id === vegetarianTrigger.dataset.vegetarianDish);
      if (dish) { event.preventDefault(); open(dish, 'vegetarian', vegetarianTrigger); }
      return;
    }
    const trigger = event.target.closest('button[data-nutrition-dish]');
    if (!trigger) return;
    const record = records.get(trigger.dataset.nutritionDish);
    if (!record) return;
    event.preventDefault();
    open(record, trigger.dataset.nutrition, trigger);
  });
  function setup(id, onChange) {
    return CatalogFilters.createDropdown(document.getElementById(id), document.getElementById(id + '-options'), entries, 'nutrition', 'Chế độ ăn', onChange);
  }
  function note(key) {
    const element = document.getElementById('nutrition-note');
    element.hidden = key === 'all';
    const restaurantPage = Boolean(document.getElementById('restaurant-grid'));
    element.textContent = restaurantPage
      ? 'Chưa có thực đơn dinh dưỡng được xác nhận từ các quán. Nhãn của phiên bản món tham khảo không áp dụng cho quán bán món đó.'
      : key === 'low-carb'
        ? 'Chưa gán nhãn ít tinh bột: chưa có tiêu chí thống nhất cho từng món. Không suy từ ngưỡng carbohydrate của chế độ ăn cả ngày.'
        : 'Dấu *: chỉ áp dụng cho phiên bản ghi dưới nhãn, theo số liệu tham khảo; không xác nhận phần ăn tại quán. Ít đường không đồng nghĩa ít tinh bột hoặc ít năng lượng.';
    const link = document.createElement('a');
    link.href = 'about.html#nutrition-sources';
    link.textContent = ' Xem tiêu chí và nguồn dinh dưỡng →';
    element.append(link);
  }
  return { entries, tags, matches, badges, vegetarianBadge, scope, setup, note };
})();
