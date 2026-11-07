/* Isolated admin draft storage. Never writes public catalog data or authentication state. */
const AdminDrafts = (() => {
  let key = 'hnag:admin-drafts:v1';
  const kinds = ['dishes','restaurants','links','recipes','reviews'];
  const empty = () => Object.fromEntries(kinds.map(kind => [kind, []]));
  const string = value => typeof value === 'string';
  function valid(kind, record) {
    if (!record || !string(record.id) || !record.id || record.id.length > 200) return false;
    if (kind === 'links') return string(record.dishId) && string(record.restaurantId);
    if (!string(record.name)) return false;
    if (kind === 'dishes') return string(record.cuisine) && Array.isArray(record.meals) && record.meals.every(string);
    if (kind === 'recipes') return Number.isInteger(record.servings) && record.servings >= 1 && record.servings <= 12 && Array.isArray(record.ingredients) && record.ingredients.every(i => i && string(i.name)) && Array.isArray(record.steps) && record.steps.every(step => Array.isArray(step) && step.every(string)) && record.source && string(record.source.label) && string(record.source.url);
    if (kind === 'reviews') return ['label','basis','condition','status','note'].every(field => string(record[field])) && (!record.source || string(record.source));
    return string(record.category);
  }
  function read(storage) {
    try {
      const raw = (storage ?? globalThis.localStorage).getItem(key);
      if (!raw) return { drafts: empty(), error: '' };
      const value = JSON.parse(raw);
      if (value?.version !== 1 || !value.drafts) throw new Error('format');
      const drafts = empty();
      for (const kind of kinds) {
        const records = value.drafts[kind];
        if (!Array.isArray(records) || !records.every(record => valid(kind,record))) throw new Error('format');
        drafts[kind] = [...new Map(records.map(record => [record.id,{...record,draft:true}])).values()];
      }
      return { drafts, error: '' };
    } catch {
      return { drafts: empty(), error: 'Không đọc được bản nháp đã lưu. Dữ liệu chưa bị xóa; hãy kiểm tra quyền lưu trữ hoặc xóa bản nháp để bắt đầu lại.' };
    }
  }
  function save(kind, record, storage) {
    if (!kinds.includes(kind) || !valid(kind,record)) return { error: 'Bản nháp không hợp lệ, chưa lưu.' };
    const current = read(storage);
    if (current.error) return current;
    current.drafts[kind] = current.drafts[kind].filter(item => item.id !== record.id);
    current.drafts[kind].unshift({...record,draft:true});
    try {
      (storage ?? globalThis.localStorage).setItem(key, JSON.stringify({version:1,drafts:current.drafts}));
      return current;
    } catch { return { error: 'Không lưu được bản nháp trên trình duyệt này. Có thể bộ nhớ đã đầy hoặc quyền lưu trữ bị chặn. Nội dung form vẫn được giữ để bạn thử lại.' }; }
  }
  function clear(storage) {
    try { (storage ?? globalThis.localStorage).removeItem(key); return { drafts:empty(),error:'' }; }
    catch { return { error:'Không xóa được bản nháp. Hãy kiểm tra quyền lưu trữ rồi thử lại.' }; }
  }
  function merge(base, drafts) {
    const originals = new Map(base.map(record => [record.id,structuredClone(record)]));
    const added = [];
    for (const record of drafts) {
      if (originals.has(record.id)) originals.set(record.id,structuredClone(record));
      else added.push(structuredClone(record));
    }
    return [...added,...originals.values()];
  }
  return {get key(){return key;},setAccount(id){if(!/^[0-9]+$/.test(String(id)))throw new Error('Invalid account');key='hnag:admin-drafts:v1:user:'+id;},kinds,read,save,clear,merge};
})();
