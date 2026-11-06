/* Trang chủ: lời chào theo giờ và ba cuộn ảnh món hợp với bữa hiện tại. */
(() => {
  const mealKey = App.getMeal();
  const meal = FOOD.MEALS[mealKey];
  document.getElementById('greet').textContent = meal.greet;
  document.getElementById('greet-sub').textContent = meal.sub;

  const REEL_LENGTH = 5;
  const fit = FOOD.DISHES.filter((d) => d.meals.includes(mealKey)).sort(() => Math.random() - 0.5);
  document.getElementById('hero-reels').innerHTML = [0, 1, 2].map((reel) => {
    const photos = Array.from({ length: REEL_LENGTH }, (_, row) => fit[(reel * REEL_LENGTH + row) % fit.length]);
    const lazy = reel === 2 ? ' loading="lazy"' : '';
    return `<div class="reel" style="--i:${reel}">
      ${photos.map((d) => `<img src="${App.photo(d, 480, 600)}" alt="" width="480" height="600"${lazy}>`).join('')}
    </div>`;
  }).join('');
})();
