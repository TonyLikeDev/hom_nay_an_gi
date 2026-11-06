/* Authenticated admin: catalog writes are checked and persisted by the server. */
(async () => {
  const user=await AdminSession.ready;if(!user)return;
  AdminDrafts.setAccount(user.id);
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const paths = {
    overview:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><path d="M3 14h7v7H3zM14 14h7v7h-7z"/>',
    restaurants:'<path d="M4 10v11h16V10M3 10l2-7h14l2 7M3 10q3 4 6 0 3 4 6 0 3 4 6 0M9 21v-7h6v7"/>',
    dishes:'<path d="M3 13h18M5 13a7 7 0 0 1 14 0M12 4v2M3 17h18"/>',
    links:'<path d="m10 13 4-4M8 15l-2 2a4 4 0 0 1-5-5l5-5a4 4 0 0 1 5 0M16 9l2-2a4 4 0 0 1 5 5l-5 5a4 4 0 0 1-5 0"/>',
    recipes:'<path d="M12 5v16M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z"/>',
    reviews:'<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7ZM8 12l3 3 5-6"/>',
    users:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 4a4 4 0 0 1 0 8M19 16a5 5 0 0 1 3 5"/>'
  };
  const icon = kind => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[kind] + '</svg>';
  const sections = {
    overview:['Tổng quan','Ưu tiên hoàn thiện dữ liệu trước khi mở rộng tính năng.'],
    restaurants:['Quán ăn','Thêm và sửa thông tin quán trên website. Thay đổi được hiển thị trên website sau khi lưu.'],
    dishes:['Món ăn','Quản lý tên món, nền ẩm thực và các bữa ăn gợi ý.'],
    links:['Món tại quán','Liên kết món với đúng địa điểm; giá từng món độc lập với khoảng giá của quán.'],
    recipes:['Công thức','Nguyên liệu, khẩu phần, bước nấu và nguồn tham khảo.'],
    reviews:['Duyệt thông tin','Đối chiếu nguyên liệu, nguồn và khẩu phần trước khi công bố nhãn.'],
    users:['Tài khoản','Danh sách tài khoản và vai trò hiện có. Chỉ admin được xem.']
  };
  const model = { dishes: structuredClone(FOOD.DISHES), restaurants: [], links: [], recipes: Object.entries(RECIPES).map(([id, recipe]) => ({ ...structuredClone(recipe), id, name: FOOD.DISHES.find(d => d.id === id)?.name || id })), reviews: [] };
  for (const dish of FOOD.DISHES) {
    if (dish.vegetarianReview) model.reviews.push({ id: dish.id + ':vegetarian', name: dish.name, label: 'Ăn chay', basis: dish.vegetarianReview.scope, source: dish.vegetarianReview.source || '', condition: dish.vegetarianReview.ingredients?.join(', ') || 'Chưa có nguyên liệu đầy đủ từ quán.', status: dish.vegetarianReview.status === 'reviewed' ? 'Đã rà soát phiên bản' : 'Theo thông tin danh mục', note: '' });
    for (const review of dish.nutritionReviews || []) model.reviews.push({ id: dish.id + ':' + review.key, name: dish.name, label: review.key === 'low-sugar' ? 'Ít đường' : 'Ít năng lượng', basis: review.basis, source: review.source, condition: review.scope, status: 'Phiên bản tham khảo', note: '' });
  }
  const baseline = structuredClone(model);
  let draftState = AdminDrafts.read();
  function applyDrafts() {
    for(const kind of AdminDrafts.kinds)model[kind]=structuredClone(baseline[kind]);
    const total=Object.values(draftState.drafts).reduce((count,items)=>count+items.length,0);
    $('admin-draft-status').textContent=draftState.error||(total?total+' bản nháp cũ còn trên thiết bị; chưa tự nhập vào dữ liệu thật.':'Các mục quản trị được lưu trên website. Không dùng bản nháp để ghi đè dữ liệu.');
    $('admin-draft-reset').hidden=!total&&!draftState.error;
  }
  let section = 'overview', page = 1, loaded = false, loadError = false, linkError = false;
  let editing, editorOpener, savingRestaurant=false;
  const pageSize = 12;
  const nameOf = id => model.dishes.find(d => d.id === id)?.name || id;
  const venueOf = id => model.restaurants.find(r => r.id === id)?.name || id;
  const badge = record => '<span class="admin-badge' + (record.draft ? ' admin-badge--draft' : '') + '">' + (record.enabled===false ? 'Ngừng công bố' : record.parentHidden?'Ẩn theo món/quán':'Đã lưu') + '</span>';
  const editButton = (kind, record, label = 'Chỉnh sửa') => '<button class="admin-row-action" data-edit="' + kind + '" data-id="' + esc(record.id) + '" aria-label="' + esc(label + ' ' + (record.name || nameOf(record.dishId))) + '">' + label + '</button>';
  function renderOverview() {
    const venues = loaded ? model.restaurants.length : '—';
    const totalLinks = loaded ? model.links.length : '—';
    $('admin-content').innerHTML = '<section class="admin-overview"><h2>Danh mục đang có</h2><p class="admin-summary"><strong>' + model.dishes.length + '</strong> món ăn <span>·</span> <strong>' + venues + '</strong> địa điểm <span>·</span> <strong>' + model.recipes.length + '</strong> công thức <span>·</span> <strong>' + totalLinks + '</strong> liên kết món–quán</p><p class="admin-help">Số liệu từ danh mục hiện có và dữ liệu đã lưu. Chưa có thống kê lượt quay, đơn hàng hoặc người dùng.</p><div class="admin-overview__columns"><section><h2>Việc cần ưu tiên</h2><ul class="admin-worklist"><li><div><strong>Đối chiếu thông tin quán</strong><p>Kiểm tra địa chỉ, thực đơn, nguồn ảnh và tình trạng hoạt động trước khi công bố.</p></div><a href="#restaurants">Xem quán →</a></li><li><div><strong>Bổ sung món và giá tại quán</strong><p>Liên kết hiện tại chưa có giá riêng được xác nhận cho từng món.</p></div><a href="#links">Xem liên kết →</a></li><li><div><strong>Rà soát nhãn ăn uống</strong><p>' + model.reviews.filter(r=>r.vegetarianReview||r.nutritionReviews?.length).length + ' món có căn cứ về ăn chay và dinh dưỡng cần giữ đúng điều kiện áp dụng.</p></div><a href="#reviews">Xem căn cứ →</a></li></ul></section><aside class="admin-overview__note"><h2>Đi từ món đến quán</h2><p>Thêm địa điểm, chuẩn hóa món rồi nối chúng bằng thực đơn có nguồn rõ ràng.</p><ol><li>Thông tin đúng chi nhánh</li><li>Món bán và giá tham khảo</li><li>Nguồn và ngày đối chiếu</li></ol><p>Liên kết giao đồ ăn chỉ thêm khi xác nhận đúng quán. Bản này chưa quản lý đơn hàng hay shipper.</p></aside></div></section>';
  }
  function table(headers, rows) {
    return '<p class="admin-scroll-hint">Vuốt ngang bảng để xem thêm thông tin và thao tác.</p><div class="admin-table-scroll" role="region" aria-label="Danh sách ' + esc(sections[section][0]) + '" tabindex="0"><table class="admin-table"><thead><tr>' + headers.map(h => '<th scope="col">' + h + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + row.map(cell => '<td>' + cell + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  function row(kind, record) {
    const title = '<strong>' + esc(record.name) + '</strong><small>' + esc(record.id) + '</small>';
    if (kind === 'restaurants') return [title, esc(record.address || 'Chưa có địa chỉ'), esc(record.category), esc(record.priceLabel || 'Chưa có'), '<span class="admin-badge'+(record.isVisible===false?' admin-badge--draft':'')+'">'+(record.isVisible===false?'Đang ẩn':'Đang hiện')+'</span>', editButton(kind, record)];
    if (kind === 'dishes') return [title, esc(FOOD.CUISINES[record.cuisine]?.name || record.cuisine), esc(record.meals.map(key => FOOD.MEALS[key]?.label || key).join(', ')), '<span class="admin-badge'+(record.isVisible===false?' admin-badge--draft':'')+'">'+(record.isVisible===false?'Đang ẩn':'Đang hiện')+'</span>', editButton(kind, record)];
    if (kind === 'recipes') return [title, esc(record.servings) + ' người', record.ingredients.length + ' nguyên liệu · ' + record.steps.length + ' bước', esc(record.source?.label || 'Chưa có nguồn'), badge(record), editButton(kind, record)];
    if (kind === 'links') return ['<strong>' + esc(nameOf(record.dishId)) + '</strong>', esc(venueOf(record.restaurantId)), esc(record.price==null?'Chưa xác nhận':new Intl.NumberFormat('vi-VN').format(record.price)+' ₫'), esc(record.offering || nameOf(record.dishId)), badge(record), editButton(kind, record)];
    return [title, esc(record.label), esc(record.status), (record.vegetarianReview?.source||record.nutritionProfile?.source) ? 'Có nguồn tham khảo' : 'Chưa có nguồn độc lập', badge(record), editButton(kind, record, 'Rà soát')];
  }
  const columns = { restaurants:['Địa điểm','Địa chỉ','Nhóm món','Khoảng giá','Trạng thái','Thao tác'], dishes:['Món ăn','Ẩm thực','Bữa gợi ý','Trạng thái','Thao tác'], recipes:['Công thức','Khẩu phần','Nội dung','Nguồn','Trạng thái','Thao tác'], links:['Món ăn','Địa điểm','Giá riêng / món','Phiên bản tại quán','Trạng thái','Thao tác'], reviews:['Món ăn','Nhãn','Căn cứ hiện tại','Nguồn','Trạng thái','Thao tác'] };
  let userRequest=0;
  async function renderUsers(){
    const request=++userRequest;
    $('admin-content').innerHTML='<section class="admin-empty"><h2>Đang tải tài khoản…</h2></section>';
    try{
      const response=await fetch('/api/admin/users',{credentials:'same-origin',cache:'no-store'});
      if(response.status===401||response.status===403){await AdminSession.check();return;}
      if(!response.ok)throw new Error();const data=await response.json();
      if(section!=='users'||request!==userRequest)return;
      $('admin-content').innerHTML=table(['Tên','Email','Vai trò'],data.items.map(item=>[esc(item.name),esc(item.email),item.role==='admin'?'Quản trị viên':'Người dùng']))+'<p class="admin-help">Hiển thị '+data.items.length+'/'+data.total+' tài khoản. Chưa có chức năng sửa quyền hoặc mật khẩu trên giao diện.</p>';
    }catch{if(section==='users')$('admin-content').innerHTML='<section class="admin-empty"><h2>Chưa tải được tài khoản</h2><p>Kiểm tra kết nối rồi thử lại.</p><button class="btn" id="admin-users-retry">Thử lại</button></section>';}
  }
  document.addEventListener('click',event=>{if(event.target.closest('#admin-users-retry'))renderUsers();});
  function render() {
    $('admin-title').textContent = sections[section][0]; $('admin-description').textContent = sections[section][1];
    document.title = sections[section][0] + ' · Quản trị | Hôm nay ăn gì?';
    document.querySelectorAll('#admin-nav a').forEach(a => { if (a.hash === '#' + section) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('admin-content').setAttribute('aria-busy', 'false');
    $('admin-add').hidden = !['restaurants','dishes','links','recipes'].includes(section);
    $('admin-add').disabled = (['links','restaurants','dishes','recipes','reviews'].includes(section) && !loaded);
    $('admin-add').textContent = 'Thêm ' + ({restaurants:'quán',dishes:'món',links:'liên kết',recipes:'công thức'}[section] || '');
    $('admin-toolbar').hidden = ['overview','users'].includes(section);
    $('admin-pagination').hidden = true;
    if (section === 'overview') return renderOverview();
    if (section === 'users') { renderUsers(); return; }
    if (['restaurants','links','dishes','recipes','reviews'].includes(section) && !loaded) { $('admin-content').innerHTML = '<section class="admin-empty"><h2>' + (loadError ? 'Chưa tải đủ dữ liệu quản trị' : 'Đang tải danh mục…') + '</h2><p>Chờ danh mục tải xong trước khi chỉnh sửa. Nếu lỗi, kiểm tra kết nối rồi thử lại.</p>' + (loadError ? '<button class="btn" data-retry>Thử tải lại</button>' : '') + '</section>'; return; }
    const normalize = value => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
    const visibilitySection=['dishes','restaurants'].includes(section);
    const filterScope=visibilitySection?'visibility':section==='reviews'?'reviews':'none';
    if($('admin-filter').dataset.scope!==filterScope){
      $('admin-filter').innerHTML=filterScope==='visibility'?'<option value="all">Tất cả hiển thị</option><option value="visible">Đang hiện</option><option value="hidden">Đang ẩn</option>':'<option value="all">Tất cả trạng thái</option><option value="reviewed">Có căn cứ nhãn</option><option value="unreviewed">Chưa gán nhãn</option>';
      $('admin-filter').dataset.scope=filterScope;
    }
    $('admin-filter').hidden=filterScope==='none';
    const query = normalize($('admin-search').value.trim()); const filter = filterScope==='none'?'all':$('admin-filter').value;
    const records = model[section].filter(record => (filter === 'all' || (visibilitySection?(filter==='visible'?record.isVisible!==false:record.isVisible===false):(filter === 'reviewed' ? !!(record.vegetarianReview||record.nutritionReviews?.length) : !(record.vegetarianReview||record.nutritionReviews?.length)))) && (!query || normalize([record.name, record.address, record.category, record.source?.label, record.label, record.offering, record.dishId && nameOf(record.dishId), record.restaurantId && venueOf(record.restaurantId)].filter(Boolean).join(' ')).includes(query)));
    const pages = Math.max(1, Math.ceil(records.length / pageSize)); page = Math.min(page, pages);
    $('admin-status').textContent = records.length + ' / ' + model[section].length + ' mục';
    $('admin-content').innerHTML = records.length ? table(columns[section], records.slice((page-1)*pageSize,page*pageSize).map(record => row(section,record))) : '<section class="admin-empty"><h2>Chưa có mục phù hợp</h2><p>Thử từ khóa khác hoặc bỏ bộ lọc.</p><button class="btn" data-clear>Bỏ lọc</button></section>';
    if (section === 'links' && linkError) $('admin-content').insertAdjacentHTML('afterbegin','<p class="admin-help">Chưa tải đủ liên kết cũ. Đang hiển thị phần có thể đối chiếu từ danh mục.</p>');
    $('admin-pagination').hidden = !records.length; $('admin-pages').textContent = 'Trang ' + page + ' / ' + pages;
    $('admin-prev').disabled = page <= 1; $('admin-next').disabled = page >= pages;
  }
  function navigate() {
    const key = location.hash.slice(1); section = Object.hasOwn(sections,key) ? key : 'overview'; page = 1;
    $('admin-search').value = ''; $('admin-filter').value = 'all'; $('admin-status').textContent = '';
    document.body.classList.remove('admin-nav-open'); $('admin-menu').setAttribute('aria-expanded','false'); render();
  }
  const field = (name, label, value = '', type = 'text', options) => {
    const id = 'field-' + name;
    let input = options ? '<select id="' + id + '" name="' + name + '" required>' + options.map(([valueId, text]) => '<option value="' + esc(valueId) + '"' + (String(valueId) === String(value) ? ' selected' : '') + '>' + esc(text) + '</option>').join('') + '</select>' : type === 'textarea' ? '<textarea id="' + id + '" name="' + name + '" rows="5" maxlength="15000">' + esc(value) + '</textarea>' : '<input id="' + id + '" name="' + name + '" type="' + type + '" value="' + esc(value) + '" maxlength="500"' + (name === 'name' ? ' required' : '') + (type === 'number' ? ' min="1" max="12" required' : '') + '>';
    return '<label class="admin-field" for="' + id + '"><span>' + label + '</span>' + input + '</label>';
  };
  function openEditor(kind, id, opener) {
    const record = model[kind].find(item => item.id === id);
    editing = { kind, id, requestId:crypto.randomUUID() }; editorOpener = opener;
    const current = record || {};
    $('editor-title').textContent = kind === 'reviews' ? 'Căn cứ · ' + current.name : (record ? 'Chỉnh sửa ' : 'Thêm ') + ({restaurants:'quán ăn',dishes:'món ăn',links:'liên kết món–quán',recipes:'công thức'}[kind]);
    $('editor-error').hidden = true; $('editor-save').textContent=['restaurants','dishes','links','recipes','reviews'].includes(kind)?'Lưu thay đổi':'Lưu bản nháp';
    $('editor-note').textContent=kind==='reviews'?'Chỉ lưu nhãn cho đúng phiên bản đã đối chiếu nguồn. Chọn không gán để thu hồi nhãn. Không suy đoán từ tên món.':kind==='recipes'?'Lưu sẽ công bố công thức trên website. Nhãn ăn chay đã rà soát của công thức này sẽ cần xác minh lại.':'Lưu sẽ cập nhật dữ liệu trên website. Chỉ nhập thông tin có căn cứ. Trường không đánh dấu * có thể để trống.';
    let fields = '';
    if (kind === 'restaurants') fields = field('name','Tên địa điểm *',current.name) + field('address','Địa chỉ / chi nhánh *',current.address) + field('area','Khu vực / tỉnh thành *',current.area) + field('category','Nhóm món *',current.category || 'Món chính','text', [...new Set([...model.restaurants.map(r=>r.category),'Món chính'])].map(c=>[c,c])) + field('priceLabel','Khoảng giá tham khảo (không phải giá từng món)',current.priceLabel) + field('priceTier','Mức giá để lọc',current.priceTier || '','text',[['','Chưa có thông tin'],...[...new Set(model.restaurants.map(r=>r.priceTier).filter(Boolean))].map(value=>[value,value])]) + field('meals','Bữa gợi ý: Sáng, Trưa, Chiều, Tối, Khuya; chưa biết để trống',current.suggestedMeals?.includes('Cả ngày')?'Sáng, Trưa, Chiều, Tối, Khuya':current.suggestedMeals?.join(', ')) + field('website','Website chính thức (https)',current.website,'url') + field('phone','Số điện thoại (chưa biết thì để trống)',current.phone,'tel') + field('hours','Giờ mở cửa — chỉ nhập khi có nguồn',current.hours) + field('imageUrl','URL ảnh thay thế được phép sử dụng (https)',current.imageUrl,'url') + field('grabFoodUrl','GrabFood đúng chi nhánh (https)',current.grabFoodUrl,'url') + field('shopeeFoodUrl','ShopeeFood đúng chi nhánh (https)',current.shopeeFoodUrl,'url') + field('partnership','Tình trạng hợp tác',current.partnership || 'unknown','text',[['unknown','Chưa xác minh hợp tác'],['draft-partner','Đề xuất đối tác — chưa xác minh']]) + field('note','Nguồn / ghi chú cần xác minh',current.note,'textarea');
    if (kind === 'dishes') fields = field('name','Tên món *',current.name) + field('cuisine','Ẩm thực',current.cuisine || 'viet','text',Object.entries(FOOD.CUISINES).map(([key,value])=>[key,value.name])) + field('meals','Bữa ăn *: Sáng, Trưa, Chiều, Tối, Khuya',current.meals?.map(key=>FOOD.MEALS[key]?.label||key).join(', ') || 'Trưa') + field('desc','Mô tả phiên bản món',current.desc,'textarea') + field('imageUrl','URL ảnh thay thế được phép sử dụng (https)',current.imageUrl,'url');
    if(['links','recipes','reviews'].includes(kind))fields=AdminCatalog.fields(kind,current,field,model);
    if(['dishes','restaurants'].includes(kind))fields=field('isVisible','Hiển thị trên website *',current.isVisible===false?'false':'true','text',[['true','Hiện — cho phép khách tìm và xem'],['false','Ẩn — chỉ admin xem và chỉnh sửa']])+'<p class="admin-help">Ẩn không xóa công thức, căn cứ hay liên kết. Món bị ẩn không xuất hiện trong lượt quay mới; quán bị ẩn không xuất hiện trong gợi ý. Bạn có thể hiện lại khi cần.</p>'+fields;
    $('editor-fields').innerHTML = fields;
    if(kind==='restaurants'){for(const key of ['address','area'])$('field-'+key).required=true;$('field-priceTier').required=false;const limits={name:255,address:500,area:120,phone:40,hours:500,note:3000,website:2000,imageUrl:2000,grabFoodUrl:2000,shopeeFoodUrl:2000};for(const [key,max]of Object.entries(limits))$('field-'+key).maxLength=max;}
    if(kind==='dishes'){for(const [key,max] of Object.entries({name:255,desc:5000,imageUrl:2000}))$('field-'+key).maxLength=max;$('field-meals').required=true;}
    if(['links','recipes','reviews'].includes(kind)){
      for(const element of $('editor-fields').querySelectorAll('input[type=url]'))element.maxLength=2000;
      if(record){$('field-dishId').disabled=true;if(kind==='links')$('field-restaurantId').disabled=true;}
      AdminCatalog.setup();
    }
    $('admin-editor').showModal(); document.body.classList.add('admin-editor-open');
    $('editor-fields').querySelector('input,textarea,select')?.focus();
  }
  $('admin-form').addEventListener('submit', async event => {
    event.preventDefault(); if(savingRestaurant)return; const {kind,id} = editing; const old = model[kind].find(record=>record.id===id); let values = Object.fromEntries(new FormData(event.currentTarget));
    Object.keys(values).forEach(key=>{values[key]=values[key].trim();});
    const error = message => { $('editor-error').hidden = false; $('editor-error').textContent = message; };
    if ('name' in values && !values.name) return error('Tên không được chỉ gồm khoảng trắng.');
    for (const key of ['website','sourceUrl','imageUrl','grabFoodUrl','shopeeFoodUrl']) if (values[key] && !values[key].startsWith('https://')) return error('Đường dẫn nguồn phải bắt đầu bằng https://.');
    if(['restaurants','dishes','links','recipes','reviews'].includes(kind)){
      if(['restaurants','dishes'].includes(kind)){
      values.isVisible=values.isVisible==='true';
      const normalizeMeal=text=>text.trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      values.meals=[...new Set(values.meals.split(',').map(m=>m.trim()).filter(Boolean).map(label=>Object.keys(FOOD.MEALS).find(key=>key===label||normalizeMeal(FOOD.MEALS[key].label)===normalizeMeal(label))))];
      if(values.meals.some(m=>!Object.hasOwn(FOOD.MEALS,m)))return error('Bữa gợi ý chỉ dùng: Sáng, Trưa, Chiều, Tối, Khuya.');
      if(kind==='dishes'&&!values.meals.length)return error('Chọn ít nhất một bữa ăn.');
      }else{
        values.dishId??=old?.dishId;if(kind==='links')values.restaurantId??=old?.restaurantId;
        try{values=AdminCatalog.parse(kind,values);}catch(e){return error(e.message);}
      }
      const original=baseline[kind].find(r=>r.id===id);
      if(original)values.revision=original.revision;
      if(!original||['links','recipes','reviews'].includes(kind))values.requestId=editing.requestId;
      savingRestaurant=true;
      const controls=[...$('admin-form').querySelectorAll('input,textarea,select,button')];const disabled=controls.map(c=>c.disabled);controls.forEach(c=>c.disabled=true);$('admin-form').setAttribute('aria-busy','true');$('editor-save').textContent='Đang lưu…';
      try{
        const response=await fetch('/api/admin/'+kind+(original?'/'+encodeURIComponent(id):''),{method:original?'PUT':'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(values),signal:AbortSignal.timeout(30000)});
        const result=await response.json();
        if(!response.ok){error(result.message||'Chưa lưu được thay đổi. Vui lòng thử lại.');if(response.status===401||response.status===403)await AdminSession.check();return;}
        if(!result.record?.id)throw new Error();
        const index=baseline[kind].findIndex(r=>r.id===result.record.id);if(index>=0)baseline[kind][index]=result.record;else baseline[kind].push(result.record);
        if(kind==='recipes'){
          const refresh=await fetch('/api/admin/reviews',{credentials:'same-origin',cache:'no-store'});
          if(refresh.ok)baseline.reviews=(await refresh.json()).items;
        }
        applyDrafts();$('admin-editor').close();render();$('admin-status').textContent=(['dishes','restaurants'].includes(kind)&&result.record.isVisible===false)?'Đã ẩn '+result.record.name+'. Dữ liệu được giữ nguyên trong admin.':'Đã lưu '+result.record.name+'. Tải lại trang công khai để xem trạng thái mới.';
      }catch{error('Chưa xác nhận được kết quả lưu. Nội dung form vẫn được giữ; hãy thử Lưu lại hoặc tải lại danh sách để kiểm tra.');}
      finally{savingRestaurant=false;controls.forEach((c,i)=>c.disabled=disabled[i]);$('admin-form').removeAttribute('aria-busy');$('editor-save').textContent='Lưu thay đổi';}
      return;
    }
  });
  $('admin-editor').addEventListener('cancel',event=>{if(savingRestaurant)event.preventDefault();});
  $('admin-editor').addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;const items=[...event.currentTarget.querySelectorAll('button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),a[href]')].filter(el=>el.getClientRects().length);
    if(event.shiftKey && document.activeElement===items[0]){event.preventDefault();items.at(-1)?.focus();}
    else if(!event.shiftKey && document.activeElement===items.at(-1)){event.preventDefault();items[0]?.focus();}
  });
  $('admin-editor').addEventListener('close',()=>{ document.body.classList.remove('admin-editor-open'); draftState=AdminDrafts.read();applyDrafts();render(); if(editorOpener?.isConnected) editorOpener.focus(); else { const replacement=[...document.querySelectorAll('[data-edit]')].find(button=>button.dataset.edit===editing?.kind && button.dataset.id===editing?.id); if(replacement)replacement.focus();else if(!$('admin-add').hidden)$('admin-add').focus();else $('admin-search').focus(); } });
  $('admin-editor').addEventListener('click',event=>{if(savingRestaurant||event.target!==$('admin-editor'))return;const r=event.target.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.target.close();});
  $('editor-close').addEventListener('click',()=>$('admin-editor').close()); $('editor-cancel').addEventListener('click',()=>$('admin-editor').close());
  $('admin-add').addEventListener('click',event=>openEditor(section,null,event.currentTarget));
  document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]');if(edit)openEditor(edit.dataset.edit,edit.dataset.id,edit);if(event.target.closest('[data-retry]'))load();if(event.target.closest('[data-clear]'))clear();});
  function clear(){ $('admin-search').value='';$('admin-filter').value='all';page=1;render(); }
  $('admin-draft-clear').addEventListener('click',()=>{
    const result=AdminDrafts.clear();
    if(result.error){$('admin-draft-status').textContent=result.error;return;}
    draftState=result;applyDrafts();$('admin-draft-reset').open=false;render();
    $('admin-title').setAttribute('tabindex','-1');$('admin-title').focus();
  });
  window.addEventListener('storage',event=>{
    if(event.key!==AdminDrafts.key && event.key!==null)return;
    if($('admin-editor').open){$('admin-draft-status').textContent='Bản nháp đã thay đổi ở tab khác. Form đang mở được giữ nguyên; lưu sẽ cập nhật mục này.';return;}
    draftState=AdminDrafts.read();applyDrafts();render();
  });
  $('admin-clear').addEventListener('click',clear); $('admin-search').addEventListener('input',()=>{page=1;render();}); $('admin-filter').addEventListener('change',()=>{page=1;render();});
  $('admin-prev').addEventListener('click',()=>{page--;render();});$('admin-next').addEventListener('click',()=>{page++;render();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('admin-nav-open')){document.body.classList.remove('admin-nav-open');$('admin-menu').setAttribute('aria-expanded','false');$('admin-menu').focus();}});
  $('admin-menu').addEventListener('click',()=>{const open=document.body.classList.toggle('admin-nav-open');$('admin-menu').setAttribute('aria-expanded',String(open));});
  $('admin-nav').innerHTML=Object.entries(sections).map(([key,[label]])=>'<a href="#'+key+'">'+icon(key)+'<span>'+label+'</span></a>').join('');
  window.addEventListener('hashchange',navigate);
  async function load() {
    loaded=false;loadError=false;render();
    try {
      const read=async url=>{const response=await fetch(url);if(!response.ok)throw new Error();return response.json();};
      const dishes=await read('/api/admin/dishes');baseline.dishes=dishes.items;Object.assign(FOOD.CUISINES,dishes.cuisines);Object.assign(FOOD.MEALS,dishes.meals);
      const first=await read('/api/admin/restaurants?pageSize=48&page=1');
      const rest=await Promise.all(Array.from({length:first.totalPages-1},(_,i)=>read('/api/admin/restaurants?pageSize=48&page='+(i+2))));
      baseline.restaurants=[...first.items,...rest.flatMap(data=>data.items)];
      const catalogs=await Promise.all(['links','recipes','reviews'].map(async kind=>[kind,(await read('/api/admin/'+kind)).items]));
      for(const [kind,items]of catalogs)baseline[kind]=items;
      loaded=true;
    } catch { loadError=true; }
    draftState=AdminDrafts.read(); applyDrafts(); render();
  }
  applyDrafts(); navigate();load();
})();
