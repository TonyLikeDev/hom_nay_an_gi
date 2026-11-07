/* Trang chủ: lời chào theo giờ và ba cuộn ảnh món hợp với bữa hiện tại. */
(() => {
  const mealKey = App.getMeal();
  const meal = FOOD.MEALS[mealKey];
  document.getElementById('greet').textContent = meal.greet;
  document.getElementById('greet-sub').textContent = meal.sub;

  const spinUI = SpinOptionsUI.mount({ button: document.getElementById('surprise-button'), label: 'Bất ngờ đi' });
  document.getElementById('surprise-button').addEventListener('click',()=>{
    if(!spinUI.pool().length)return;
    const query=SpinFilters.params(spinUI.options);query.set('mode','any');location.assign('result.html?'+query);
  });

  const REEL_LENGTH = 5;
  const preferred = FOOD.DISHES.filter((d) => d.meals.includes(mealKey));
  const fit = (preferred.length ? preferred : FOOD.DISHES).slice().sort(() => Math.random() - 0.5);
  if(!fit.length){document.getElementById('hero-reels').innerHTML='<p class="admin-help">Danh mục đang được cập nhật. Bạn quay lại sau nhé.</p>';return;}
  document.getElementById('hero-reels').innerHTML = [0, 1, 2].map((reel) => {
    const photos = Array.from({ length: REEL_LENGTH }, (_, row) => fit[(reel * REEL_LENGTH + row) % fit.length]);
    const lazy = reel === 2 ? ' loading="lazy"' : '';
    return `<div class="reel" style="--i:${reel}">
      ${photos.map((d) => `<img src="${App.photo(d, 480, 600)}" alt="" width="480" height="600"${lazy}>`).join('')}
    </div>`;
  }).join('');
})();
