/* Device-local IDs only; a failed write never pretends an item was saved. */
const Favorites = (() => {
  const key = 'hnag:favorites:v1';
  const heart = '<svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>';
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      const ids = type => Array.isArray(value?.[type]) ? [...new Set(value[type].filter(id => typeof id === 'string' && /^[a-z0-9-]{1,100}$/.test(id)))] : [];
      return { dishes: ids('dishes'), restaurants: ids('restaurants') };
    } catch { return { dishes: [], restaurants: [] }; }
  }
  const has = (type, id) => read()[type]?.includes(id) || false;
  function button(type, id, name, text = false) {
    const saved = has(type, id);
    return `<button type="button" class="favorite-button${text ? ' favorite-button--text' : ''}" data-favorite-type="${type}" data-favorite-id="${escape(id)}" data-favorite-name="${escape(name)}" aria-pressed="${saved}" aria-label="${escape((saved ? 'Bỏ lưu ' : 'Lưu yêu thích ') + name)}">${heart}${text ? '<span>' + (saved ? 'Đã lưu' : 'Yêu thích') + '</span>' : ''}</button>`;
  }
  function refresh() {
    document.querySelectorAll('[data-favorite-id]').forEach(button => {
      const saved = has(button.dataset.favoriteType, button.dataset.favoriteId);
      button.setAttribute('aria-pressed', String(saved));
      button.setAttribute('aria-label', (saved ? 'Bỏ lưu ' : 'Lưu yêu thích ') + button.dataset.favoriteName);
      const label = button.querySelector('span'); if (label) label.textContent = saved ? 'Đã lưu' : 'Yêu thích';
    });
  }
  function announce(message) {
    let status = document.getElementById('favorite-feedback');
    if (!status) { status = document.createElement('p'); status.id = 'favorite-feedback'; status.className = 'favorite-feedback'; status.setAttribute('role', 'status'); document.body.append(status); }
    status.textContent = message;
    clearTimeout(announce.timer); announce.timer = setTimeout(() => { status.textContent = ''; }, 4500);
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button[data-favorite-id]'); if (!target) return;
    const { favoriteType:type, favoriteId:id } = target.dataset;
    if (!['dishes', 'restaurants'].includes(type)) return;
    const state = read(); const saved = state[type].includes(id);
    state[type] = saved ? state[type].filter(value => value !== id) : [...state[type], id];
    try { localStorage.setItem(key, JSON.stringify(state)); }
    catch { announce('Không lưu được trên trình duyệt này. Hãy cho phép lưu trữ rồi thử lại.'); return; }
    refresh(); announce((saved ? 'Đã bỏ lưu ' : 'Đã lưu ') + target.dataset.favoriteName);
    document.dispatchEvent(new CustomEvent('favoriteschange', { detail: { type, id, saved: !saved } }));
  });
  window.addEventListener('storage', event => { if (event.key === key || event.key === null) { refresh(); document.dispatchEvent(new Event('favoriteschange')); } });
  return { read, has, button, refresh };
})();
