// Curated offerings explicitly named in the restaurant source; safe to rerun.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = new URL('../', import.meta.url);
const file = path => new URL(path, root);
const food = JSON.parse(fs.readFileSync(file('data/food.json'), 'utf8'));
const { restaurants } = JSON.parse(fs.readFileSync(file('data/restaurants.json'), 'utf8'));
const associations = JSON.parse(fs.readFileSync(file('data/dish-restaurants.json'), 'utf8'));
// id, display name, explicit supporting source numbers, cuisine, short description.
const additions = [
  ['mi-quang', 'Mì Quảng', [1, 66, 78, 93], 'viet', 'Mì Quảng với các phiên bản tôm thịt hoặc ếch tùy quán.'],
  ['bun-cha-ca', 'Bún chả cá', [2, 3], 'viet', 'Bún chả cá được nhắc đến trong danh sách quán Đà Nẵng.'],
  ['banh-trang-thit-heo', 'Bánh tráng cuốn thịt heo', [4, 5], 'viet', 'Bánh tráng thịt heo; phần ăn và món kèm tùy quán.'],
  ['nem-lui', 'Nem lụi', [6], 'viet', 'Nem lụi trong các món đặc trưng của Bánh Xèo Bà Dưỡng.'],
  ['bun-mam-thit-quay', 'Bún mắm thịt quay', [7], 'viet', 'Bún mắm thịt quay được giới thiệu tại Bún Mắm Vân.'],
  ['bun-bo', 'Bún bò', [8, 9], 'viet', 'Bún bò ở các quán được liên kết; khác với món bún chả cá.'],
  ['com-ga', 'Cơm gà', [10, 11], 'viet', 'Cơm gà với lựa chọn xối mỡ tại A Hải và cơm gà Hồng Ngọc.'],
  ['pizza-pho-mai', 'Pizza phô mai tươi', [13], 'y', 'Pizza phô mai tươi; chưa xác nhận là phiên bản Margherita.'],
  ['bo-bit-tet', 'Bò bít tết', [14], 'quoc-te', 'Bò bít tết được nêu trong các món đặc trưng của quán.'],
  ['mam-com-gia-dinh', 'Mâm cơm gia đình', [17], 'viet', 'Mâm cơm gia đình, các món trong mâm tùy thực đơn của quán.'],
  ['met-cuon', 'Mẹt cuốn tổng hợp', [18], 'viet', 'Mẹt cuốn tổng hợp được giới thiệu tại Bếp Cuốn.'],
  ['banh-beo', 'Bánh bèo', [19], 'viet', 'Một trong những món bánh được nêu tại Bánh Bèo Bà Bé.'],
  ['banh-nam', 'Bánh nậm', [19], 'viet', 'Bánh nậm trong nhóm bánh bèo, nậm, lọc của quán.'],
  ['banh-bot-loc', 'Bánh bột lọc', [19], 'viet', 'Bánh lọc; nhân và nước chấm cần xem thực đơn của quán.'],
  ['banh-canh', 'Bánh canh', [20, 64], 'viet', 'Bánh canh tại quán Ruộng Phương và Bánh Canh Chờ.'],
  ['oc-hut', 'Ốc hút', [21, 55, 63, 81], 'viet', 'Ốc hút, một lựa chọn ăn vặt được nhắc ở nhiều địa điểm.'],
  ['mit-tron', 'Mít trộn', [21, 22], 'viet', 'Mít trộn; thành phần và phần ăn khác nhau tùy quán.'],
  ['ram-cuon-cai', 'Ram cuốn cải', [23], 'viet', 'Ram cuốn cải tại khu phố Đào Duy Từ.'],
  ['banh-trang-kep', 'Bánh tráng kẹp', [24, 25], 'viet', 'Bánh tráng kẹp; nhân bánh tùy lựa chọn của quán.'],
  ['yaourt-muoi', 'Yaourt muối', [26], 'viet', 'Yaourt muối được giới thiệu tại quán Cô Tuyết.'],
  ['che-sau-rieng', 'Chè sầu riêng', [27], 'viet', 'Chè sầu riêng được nêu trong các món đặc trưng của Chè Liên.'],
  ['che-dau', 'Chè đậu', [28], 'viet', 'Chè đậu tại Chè Xuân Trang; loại đậu tùy thực đơn.'],
  ['che-thap-cam', 'Chè thập cẩm', [28], 'viet', 'Chè thập cẩm, thành phần thay đổi theo cách làm của quán.'],
  ['kem-bo', 'Kem bơ', [29, 62], 'viet', 'Kem bơ ở các địa điểm Cô Vân được liệt kê.'],
  ['banh-kem', 'Bánh kem', [34, 83], 'quoc-te', 'Bánh kem, kích cỡ và trang trí cần liên hệ từng tiệm.'],
  ['banh-su-kem', 'Bánh su kem', [34], 'quoc-te', 'Bánh su kem trong các món bánh của MiaCake.'],
  ['croissant', 'Croissant', [35], 'quoc-te', 'Bánh croissant được nêu tại Bonjour Resto’ Bakery.'],
  ['tiramisu', 'Tiramisu', [35, 83], 'y', 'Tiramisu tại các tiệm bánh có thông tin món này.'],
  ['bong-lan-trung-muoi', 'Bông lan trứng muối', [36], 'viet', 'Bánh bông lan trứng muối được giới thiệu tại Napom’s Bakery.'],
  ['ca-phe-cot-dua', 'Cà phê cốt dừa', [37], 'viet', 'Cà phê cốt dừa được nêu tại Cộng Cà Phê.'],
  ['ca-phe-dac-san', 'Cà phê đặc sản', [38, 40, 71], 'quoc-te', 'Specialty coffee; hạt và phương pháp pha theo thực đơn quán.'],
  ['nuoc-mia-sau-rieng', 'Nước mía sầu riêng', [41], 'viet', 'Nước mía sầu riêng tại Nước Mía Bà Diệu.'],
  ['lau-nam-chay', 'Lẩu nấm chay', [42], 'viet', 'Lẩu nấm được nêu tại Chay An Lạc Tâm; thành phần cần hỏi quán.'],
  ['com-chay', 'Cơm chay', [42, 43, 102], 'viet', 'Cơm chay và cơm chay tự chọn theo thực đơn từng quán.'],
  ['bun-chay', 'Bún chay', [43], 'viet', 'Bún trong nhóm món được giới thiệu tại Chay Hương Sen.'],
  ['mi-chay', 'Mì chay', [43], 'viet', 'Mì trong nhóm món của Chay Hương Sen; kiểm tra thành phần khi gọi.'],
  ['banh-canh-cua', 'Bánh canh cua', [51], 'viet', 'Bánh canh cua được nêu tại Bánh Canh Cua Quân.'],
  ['bun-hai-san', 'Bún hải sản bề bề', [52], 'viet', 'Bún hải sản bề bề tại địa điểm được liên kết.'],
  ['bach-tuoc-nuong', 'Bạch tuộc nướng', [54], 'viet', 'Lựa chọn tại khu chợ đêm, cần kiểm tra quầy bán cụ thể.'],
  ['xien-que', 'Xiên que', [54], 'viet', 'Các loại xiên que tại chợ đêm, nguyên liệu tùy quầy.'],
  ['oc-buou-tron', 'Ốc bươu trộn', [55], 'viet', 'Ốc bươu trộn được nêu trong các món của Ốc Thanh.'],
  ['ca-phe-bo', 'Cà phê bơ', [57], 'viet', 'Cà phê bơ được giới thiệu tại Trình Cà Phê.'],
  ['cinnamon-roll', 'Cinnamon roll', [58], 'quoc-te', 'Bánh cuộn quế được nêu tại Jeremy’s Kitchen.'],
  ['goi-cuon-chay', 'Gỏi cuốn chay', [60], 'viet', 'Gỏi cuốn được giới thiệu tại Chay Phúc An; cần hỏi về sốt chấm.'],
  ['burger', 'Burger', [67], 'quoc-te', 'Burger tại Bikini Bottom Express; nhân bánh tùy thực đơn.'],
  ['pizza-cui', 'Pizza lò củi', [68], 'y', 'Pizza lò củi của L’Italiano; loại phủ mặt cần xem thực đơn.'],
  ['pasta-y', 'Pasta Ý', [68], 'y', 'Pasta Ý; chưa xác nhận riêng loại sốt Carbonara.'],
  ['tacos', 'Tacos', [69], 'quoc-te', 'Tacos tại Poca Taco; nhân và sốt tùy lựa chọn.'],
  ['bagel', 'Bagel', [70], 'quoc-te', 'Bánh bagel được nêu tại The Hideout Cafe.'],
  ['smoothie-bowl', 'Smoothie bowl', [70, 72], 'quoc-te', 'Sinh tố bowl tại các địa điểm có thông tin món này.'],
  ['burger-chay', 'Burger chay', [72], 'quoc-te', 'Burger chay được nêu tại Roots; cần kiểm tra bánh và sốt.'],
  ['banh-dap', 'Bánh đập', [75], 'viet', 'Bánh đập tại khu đường Châu Thị Vĩnh Tế.'],
  ['hen-xao', 'Hến xào', [75], 'viet', 'Hến xào được nêu cùng bánh đập tại khu vực này.'],
  ['banh-canh-ca-loc', 'Bánh canh cá lóc', [76], 'viet', 'Bánh canh cá lóc tại Thanh Hương.'],
  ['bo-ne', 'Bò né', [77], 'viet', 'Bò né với ốp la, pate được giới thiệu tại quán Khanh.'],
  ['chao-vit', 'Cháo vịt', [79], 'viet', 'Cháo vịt ở địa điểm Cháo Vịt Hải.'],
  ['goi-vit', 'Gỏi vịt', [79], 'viet', 'Gỏi vịt trộn được nêu trong các món đặc trưng của quán.'],
  ['chao-dau-xanh', 'Cháo đậu xanh', [79], 'viet', 'Cháo đậu xanh tại quán vịt; không mặc định là món chay.'],
  ['pha-lau', 'Phá lấu', [80], 'viet', 'Phá lấu ăn cùng bánh mì; không đồng nhất với bánh mì kẹp.'],
  ['cut-lon-xao-me', 'Cút lộn xào me', [82], 'viet', 'Cút lộn xào me được nêu tại quán Cô Thảo.'],
  ['rau-ma-sau-rieng', 'Rau má sầu riêng', [87], 'viet', 'Rau má sầu riêng trong danh sách đồ uống Rau Má Mix.'],
  ['rau-ma-dau-xanh', 'Rau má đậu xanh', [87], 'viet', 'Rau má đậu xanh được giới thiệu tại Rau Má Mix.'],
  ['bun-mam-chay', 'Bún mắm chay', [88], 'viet', 'Bún mắm chay tại Chay Thúy; cần hỏi thành phần mắm và sốt.'],
  ['banh-loc-chay', 'Bánh lọc chay', [88], 'viet', 'Bánh lọc chay được nêu tại Chay Thúy.'],
  ['be-thui', 'Bê thui Cầu Mống', [90, 91], 'viet', 'Bê thui Cầu Mống tại các quán có tên món tương ứng.'],
  ['banh-kho-me', 'Bánh khô mè', [92], 'viet', 'Bánh khô mè, đặc sản được giới thiệu tại Bà Liễu Mẹ.'],
  ['goi-ca-nam-o', 'Gỏi cá Nam Ô', [94, 95], 'viet', 'Gỏi cá Nam Ô; lựa chọn khô hoặc ướt cần hỏi từng quán.'],
  ['trung-chen-nuong', 'Trứng chén nướng', [96], 'viet', 'Món được nêu tại Chợ Đêm Hòa Khánh; tìm quầy trước khi gọi.'],
  ['chan-ga', 'Chân gà', [96], 'viet', 'Món chân gà tại khu chợ đêm; cách chế biến tùy quầy.'],
  ['lau-bo', 'Lẩu bò', [97], 'viet', 'Lẩu bò được nêu tại Lẩu Bò Sáu Hưng.'],
  ['nuoc-ep', 'Nước ép', [101], 'viet', 'Nước ép trái cây; loại trái cây và giá cần kiểm tra ở quán.'],
  ['sinh-to', 'Sinh tố', [101], 'viet', 'Sinh tố trái cây tại quán Cô Bông, lựa chọn theo thực đơn.'],
  ['bun-rieu-chay', 'Bún riêu chay', [102], 'viet', 'Bún riêu chay được nêu tại Chay Tâm Đức.'],
  ['lau-ga-la-e', 'Lẩu gà lá é', [104], 'viet', 'Lẩu gà lá é được giới thiệu tại Tao Ngộ, chi nhánh Cẩm Lệ.'],
  ['kem-xoi-dua', 'Kem xôi dừa', [105], 'viet', 'Kem xôi dừa Mã Lai; khác với xôi xoài của Thái Lan.'],
];
food.CUISINES['quoc-te'] = { name: 'Quốc tế', cover: 'burger', desc: 'Bánh, đồ uống và món ăn từ nhiều nền ẩm thực.', icon: 'globe' };
const keys = { Sáng: 'sang', Trưa: 'trua', Chiều: 'chieu', Tối: 'toi', Khuya: 'khuya' };
const allDay = ['sang', 'trua', 'chieu', 'toi'];
const added = new Set(additions.map(row => row[0]));
const sourceVegetarian = new Set(['lau-nam-chay', 'com-chay', 'bun-chay', 'mi-chay', 'goi-cuon-chay', 'burger-chay', 'bun-mam-chay', 'banh-loc-chay', 'bun-rieu-chay']);
associations.links = associations.links.filter(link => !added.has(link.dishId));
for (const [id, name, numbers, cuisine, desc] of additions) {
  const venues = numbers.map(number => restaurants.find(r => r.sourceNumber === number));
  assert.ok(venues.every(Boolean), id);
  const meals = [...new Set(venues.flatMap(r => r.suggestedMeals.flatMap(m => m === 'Cả ngày' ? allDay : keys[m] || [])))];
  const imageSource = venues.find(r => r.photo.kind === 'illustration') || venues[0];
  const dish = { id, name, cuisine, meals, desc,
    imageUrl: imageSource.photo.kind === 'illustration' ? imageSource.photo.local : id === 'pizza-pho-mai' ? 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=75' : imageSource.photo.local,
    imageSource: { label: imageSource.photo.kind === 'illustration' ? 'Unsplash · ảnh minh họa' : imageSource.photo.sourceLabel, url: imageSource.photo.sourceUrl },
    source: { type: 'restaurant-catalog', restaurantIds: venues.map(r => r.id) },
  };
  if (id === 'pizza-pho-mai') dish.imageSource = { label: 'Unsplash · aurel__lens · ảnh minh họa', url: 'https://unsplash.com/@aurel__lens' };
  if (sourceVegetarian.has(id)) dish.vegetarianReview = {
    status: 'source-declared',
    scope: 'Món được giới thiệu là chay theo tên món và thông tin quán; chưa rà soát đầy đủ nguyên liệu, nước dùng và sốt.',
    restaurantIds: venues.map(r => r.id),
  };
  const existing = food.DISHES.findIndex(d => d.id === id);
  if (existing < 0) food.DISHES.push(dish);
  else { assert.equal(food.DISHES[existing].source?.type, 'restaurant-catalog', `Would overwrite original ${id}`);
    const previous = food.DISHES[existing];
    if (previous.nutritionProfile) dish.nutritionProfile = previous.nutritionProfile;
    if (previous.nutritionReviews) dish.nutritionReviews = previous.nutritionReviews;
    food.DISHES[existing] = dish; }
  venues.forEach(r => associations.links.push({ dishId: id, restaurantId: r.id, type: 'dish', offering: name, evidence: r.name }));
}
for (const dish of food.DISHES) {
  dish.linkedRestaurantCount = new Set(associations.links.filter(link => link.dishId === dish.id && link.type === 'dish').map(link => link.restaurantId)).size;
}
assert.equal(new Set(food.DISHES.map(d => d.id)).size, food.DISHES.length);
fs.writeFileSync(file('data/food.json'), JSON.stringify(food, null, 2) + '\n');
fs.writeFileSync(file('data/dish-restaurants.json'), JSON.stringify(associations, null, 2) + '\n');
fs.writeFileSync(file('public/js/data.js'), '/* Generated from data/food.json; run node scripts/expand-dish-catalog.mjs after curated updates. */\nconst FOOD = ' + JSON.stringify(food, null, 2) + ';\n');
console.log(JSON.stringify({ added: additions.length, total: food.DISHES.length, linkedDishes: food.DISHES.filter(d => d.linkedRestaurantCount).length, links: associations.links.length }));
