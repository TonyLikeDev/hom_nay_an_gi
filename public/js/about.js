/* Trang Giới thiệu: mood board và danh sách tác giả ảnh. */
(() => {
  const references = document.getElementById('nutrition-references');
  FOOD.DISHES.filter(dish => dish.nutritionProfile).forEach(dish => {
    const profile = dish.nutritionProfile;
    const section = document.createElement('section');
    section.id = 'nutrition-' + dish.id;
    const heading = document.createElement('h3');
    heading.textContent = dish.name;
    section.append(heading);
    const summary = document.createElement('p');
    summary.textContent = profile.scope + ' Khẩu phần nguồn: ' + profile.serving + '. ' + profile.values.energyKcal + ' kcal; ' + profile.values.sugarsG + ' g đường; ' + profile.values.carbohydrateG + ' g carbohydrate. ' + profile.dataNote;
    section.append(summary);
    dish.nutritionReviews.forEach(review => {
      const basis = document.createElement('p');
      basis.textContent = review.basis;
      section.append(basis);
    });
    const source = document.createElement('a');
    source.href = profile.source;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = profile.sourceLabel + ' ↗';
    const checked = document.createElement('p');
    checked.textContent = 'Đối chiếu ngày 02/11/2026. Không xác nhận thực đơn hoặc toàn bộ quán liên kết.';
    section.append(source, checked);
    references.append(section);
  });
  const MOOD = ['pho-bo', 'banh-xeo', 'ramen', 'bibimbap', 'pad-thai', 'pizza-margherita'];
  const byId = (id) => FOOD.DISHES.find((d) => d.id === id);

  document.getElementById('mood').innerHTML = MOOD.map((id, i) => {
    const dish = byId(id);
    const wide = i === 0 || i === MOOD.length - 1;
    return `<img src="${App.photo(dish, wide ? 960 : 560, 560)}" alt="${dish.name}" loading="lazy">`;
  }).join('');

  document.getElementById('credits').innerHTML = FOOD.DISHES.map(d => d.by
    ? `<li>${d.name}: <a href="https://unsplash.com/@${d.by}" rel="noopener">@${d.by}</a></li>`
    : `<li>${d.name}: <a href="${d.imageSource.url}" rel="noopener">${d.imageSource.label}</a></li>`).join('');
  document.getElementById('credits-summary').textContent = `Xem nguồn ảnh cho ${FOOD.DISHES.length} món`;
})();
