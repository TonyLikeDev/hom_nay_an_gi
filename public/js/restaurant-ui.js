/* Shared directory cards, including transparent photo provenance. */
const RestaurantUI = (() => {
  const placeholder = '/images/restaurants/placeholder.svg';
  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text != null) element.textContent = text;
    return element;
  };
  const safeLink = value => {
    try { const url = new URL(value); return url.protocol === 'https:' ? url.href : null; } catch { return null; }
  };
  function external(label, href, className = '') {
    const link = make('a', className, label);
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }
  function photo(record) {
    const figure = make('figure', 'restaurant-photo');
    const image = make('img');
    const genuine = record.photo.kind === 'official-page';
    const supplied=record.photo.kind==='admin-provided'&&safeLink(record.photo.url);
    image.src = record.photo.local?.startsWith('/images/restaurants/') ? record.photo.local : supplied || placeholder;
    image.alt = supplied ? 'Ảnh do quản trị viên cung cấp cho '+record.name : genuine ? `Ảnh từ website của ${record.name}` : 'Ảnh minh họa ẩm thực, không phải ảnh của quán';
    image.width = 600;
    image.height = 400;
    image.loading = 'lazy';
    image.addEventListener('error', () => {
      if (!image.src.endsWith('placeholder.svg')) image.src = placeholder;
      figure.querySelector('figcaption').textContent = 'Chưa có ảnh phù hợp';
    });
    figure.append(image, make('figcaption', genuine ? 'restaurant-photo__label restaurant-photo__label--source' : 'restaurant-photo__label', supplied ? 'Ảnh được cung cấp' : genuine ? 'Ảnh từ website quán' : record.photo.local ? 'Ảnh minh họa' : 'Chưa có ảnh phù hợp'));
    return figure;
  }
  const mapsUrl = record => `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: `${record.name}, ${record.address}, ${record.area}` })}`;
  function renderCard(record, onDetail, headingTag = 'h2') {
    const openDetail = onDetail || (id => location.assign(`restaurants.html?restaurant=${encodeURIComponent(id)}`));
    const li = make('li');
    const article = make('article', 'restaurant-card');
    const content = make('div', 'restaurant-card__content');
    const heading = make(headingTag);
    const button = make('a', 'restaurant-card__title', record.name);
    button.href = 'restaurant.html?id=' + encodeURIComponent(record.id);
    heading.append(button);
    if (typeof Nutrition !== 'undefined') {
      const badges = make('span', 'restaurant-card__nutrition');
      badges.innerHTML = Nutrition.badges(record);
      heading.append(badges);
    }
    const category = make('p', 'restaurant-card__category', record.category);
    const address = make('p', 'restaurant-card__address', record.address);
    const price = make('p', 'restaurant-card__price', record.priceLabel);
    const meals = make('div', 'dish__meals');
    meals.setAttribute('aria-label', 'Bữa gợi ý');
    const keys = { Sáng: 'sang', Trưa: 'trua', Chiều: 'chieu', Tối: 'toi', Khuya: 'khuya' };
    record.suggestedMeals.forEach(meal => {
      const tag = make('span', 'meal-tag');
      if (keys[meal]) tag.innerHTML = App.mealIcon(keys[meal]);
      tag.append(document.createTextNode(meal));
      meals.append(tag);
    });
    const actions = make('div', 'restaurant-card__actions');
    actions.append(external('Tìm trên Maps ↗', mapsUrl(record), 'restaurant-map-link'));
    const detail = make(onDetail ? 'button' : 'a', 'restaurant-info-link', onDetail ? 'Xem nhanh →' : 'Xem quán →');
    if (onDetail) {
      detail.type = 'button';
      detail.setAttribute('aria-haspopup', 'dialog');
      detail.setAttribute('aria-controls', 'restaurant-detail');
      detail.setAttribute('aria-label', `Xem nhanh thông tin ${record.name}`);
      detail.addEventListener('click', () => openDetail(record.id, detail));
    } else detail.href = button.href;
    actions.append(detail);
    content.append(category, heading);
    if (record.dishMatch) {
      const match=record.dishMatch;
      content.append(make('p', 'restaurant-match',match.offering+(match.priceVnd!=null?' · '+new Intl.NumberFormat('vi-VN').format(match.priceVnd)+' ₫ / phần':'')));
      if(match.sourceUrl&&safeLink(match.sourceUrl))content.append(external('Nguồn thực đơn ↗',match.sourceUrl,'restaurant-info-link'));
    }
    content.append(address, price, make('p', 'restaurant-card__price-note', 'Khoảng giá tham khảo'), meals, actions);
    article.append(photo(record), content);
    const save = make('div', 'restaurant-card__save'); save.innerHTML = Favorites.button('restaurants', record.id, record.name); article.append(save);
    li.append(article);
    return li;
  }

  return { make, safeLink, external, photo, mapsUrl, renderCard };
})();
