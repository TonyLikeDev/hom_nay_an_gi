# Hôm nay ăn gì?

HTML/CSS/JavaScript + Node.js, không dùng EJS. Cần Node.js 24.x.

## Chạy

Lần đầu: `npm install`, tạo database/tài khoản và `.env` theo [database/README.md](database/README.md), rồi chạy `npm run db:setup`.
`npm start` rồi mở http://127.0.0.1:3000. MySQL phải đang chạy.
`npm run dev` tự khởi động lại server khi sửa file. Chạy `npm install` để cài dependency, gồm mysql2 cho công cụ database.
Có thể chép `.env.example` thành `.env` để đổi HOST/PORT.

## Cấu trúc

- public/: tầng View, toàn bộ HTML/CSS/JS gửi xuống trình duyệt (không dùng EJS).
- server/app.js: HTTP server và phục vụ file tĩnh.
- server/routes/dish.routes.js: ánh xạ URL và HTTP method sang controller.
- server/controllers/dish.controller.js: nhận yêu cầu và trả JSON cho frontend.
- server/models/: tầng Model đọc MySQL bằng pool mysql2, ánh xạ về định dạng dữ liệu frontend hiện có.
- server/config/, middleware/, services/, validators/, utils/: khung chuẩn bị cho backend; mỗi thư mục có hướng dẫn trách nhiệm.
- server/views/: dành sẵn cho template nếu sau này cần; View hiện tại vẫn là public/, không dùng EJS.
- database/migrations/, database/seeds/: dành cho cấu trúc và dữ liệu khởi tạo database sau này.
- scripts/, tests/: dành cho công cụ bảo trì và kiểm thử khi triển khai backend.
- data/food.json: 105 món/bánh/đồ uống, 7 nhóm ẩm thực và các bữa ăn; 78 món có quán liên kết trực tiếp.
- docs/DEVELOPMENT.md: hướng dẫn triển khai tiếp.

## API hiện có

- `restaurants.html`: danh sách thử 105 địa điểm Đà Nẵng từ Excel, có tìm kiếm/lọc/phân trang và chi tiết.
- `GET /api/restaurants`: danh sách quán (q, category, meal, priceTier, page, pageSize).
- `GET /api/restaurants/dn-013`: chi tiết một địa điểm.
- Dữ liệu và nguồn ảnh: `docs/RESTAURANT-DATA.md`; kiểm tra bằng `node --test tests/restaurants.test.js`.

- GET /api/dishes
- GET /api/dishes?cuisine=viet&meal=sang
- GET /api/dishes/pho-bo

Khi chạy Node.js, `/js/data.js` và `/js/recipes.js` được tạo từ MySQL, giữ các biến FOOD/RECIPES để frontend không phải đổi. Các file JSON và bản JS trong public chỉ là nguồn seed/bản xem tĩnh; sửa chúng không cập nhật dữ liệu website chạy qua Node. Không có fallback JSON khi database lỗi; API trả HTTP 503 với thông báo chung.

Danh mục món/quán, liên kết, bữa ăn, nhãn và 14 công thức đã đọc từ MySQL 8.4 LTS qua backend MVC. Đã có đăng nhập và phân quyền admin bằng MySQL; đã có API ghi cho các mục quản trị; chưa tích hợp đơn hàng.


### Yêu thích và công thức (frontend)

Trang `favorites.html` lưu ID món/quán trong localStorage (`hnag:favorites:v1`) của trình duyệt hiện tại, không có tài khoản hay đồng bộ giữa thiết bị. Nút trái tim ở danh mục, kết quả, công thức và chi tiết quán; đồng bộ trạng thái giữa các tab cùng origin. Khi trình duyệt chặn ghi, giao diện báo lỗi và không hiện thành công giả. Quán tải qua API đọc hiện có; lỗi tải không xóa ID đã lưu.

8 công thức: xôi xoài, bruschetta, phở bò phiên bản nhanh, Pad Thai tôm, pizza Margherita, onigiri cá ngừ, canh kim chi, risotto nấm. Sáu công thức bổ sung được biên soạn tiếng Việt với định lượng điều chỉnh, dẫn nguồn ở từng trang (Canada’s Food Guide, Good Food, Just One Cookbook, Maangchi, Diabetes UK). Không phải công thức xác nhận của quán; không tự lan truyền nhãn dinh dưỡng/chay. Tất cả dùng chung bộ chọn 1–12 người và đánh dấu bước nấu.


Bổ sung đợt 03/11/2026: bún chả bản áp chảo, bánh xèo tôm thịt, bibimbap bản rau phổ biến, kimbap nhân xúc xích, mapo tofu giảm dầu/cay và Tom Yum tôm nước trong. Tổng 14 công thức. Nguồn và các điều chỉnh ghi ở từng trang; không đổi nhãn dinh dưỡng hoặc ăn chay.


### Đăng nhập quản trị

Đã có đăng nhập thật bằng Better Auth + MySQL, cookie HttpOnly và kiểm tra role admin ở server. Xem [docs/AUTH.md](docs/AUTH.md) để thiết lập secret, migration, quyền MySQL và tạo admin đầu tiên. Chạy `npm run admin:create -- email-cua-ban@example.com` trong terminal tương tác, hoặc thêm `--desktop` trên Windows; không có mật khẩu mẫu.

Trang `admin.html` và API `/api/admin/*` yêu cầu admin. Tab Tài khoản đọc danh sách thật từ MySQL, không lộ password hash/token. Mục Quán ăn thêm/sửa và lưu thật vào MySQL; xem [hướng dẫn quản trị quán](docs/RESTAURANT-ADMIN.md). Món ăn, liên kết, công thức và căn cứ nhãn cũng lưu thật; xem [hướng dẫn quản trị danh mục](docs/ADMIN-CATALOG.md). Bản nháp cũ được giữ riêng để đối chiếu, không tự nhập. Đăng xuất thu hồi phiên trong MySQL.

### Tùy chọn quay bất ngờ

Trang chủ mở rộng Tùy chọn ngay dưới Bất ngờ đi: chế độ ăn, có công thức, có quán và số món khớp. Dùng chung `spin-filters.js` cho số lượng và tập món khi quay lại; `App.pickDish` chỉ ưu tiên bữa hiện tại bên trong tập đã lọc. Điều kiện nằm trong URL để tải lại và trở về sửa, không ghi vào dữ liệu hay backend. Không tự bỏ điều kiện khi hết món; khóa nút quay hoặc hiện trạng thái rỗng khi mở link kết quả trực tiếp.


Popup Bất ngờ đi ở trang Ẩm thực dùng chung `spin-options-ui.js` với trang chủ. Chỉ quay các nền ẩm thực có món khớp điều kiện, khóa điều kiện khi đang quay, không bỏ lọc khi hết món. Điều kiện đi theo URL sang kết quả/quay lại; Chỉnh tùy chọn trở về đúng popup.

## Chuẩn bị MySQL

Đã có `database/schema.sql`, công cụ kiểm tra/nhập và test MySQL thật. Xem [database/README.md](database/README.md) để tạo tài khoản riêng, cấu hình `.env` và nhập.

- `npm run db:check`: kiểm tra nguồn, không kết nối database.
- `npm run db:setup`: tạo schema trong DB_NAME và nhập dữ liệu ban đầu.
- `npm run db:import`: nhập vào schema đã có; không ghi đè dữ liệu.
- `npm test`: kiểm thử dữ liệu và Model/API trên instance MySQL tạm riêng.
- `npm run test:db`: test MySQL 8.4 trên instance tạm riêng, không dùng dịch vụ/database của bạn.

Frontend giữ nguyên giao diện; Model/API và các script dữ liệu động hiện đọc MySQL. Runtime cần SELECT cho danh mục và quyền ghi trên bảng phiên/rate-limit theo docs/AUTH.md; dùng tài khoản nhập riêng khi chạy db:setup.

## Người khác sử dụng như thế nào?

- Thành viên phát triển: clone branch, cài Node.js/MySQL 8.4, `npm install`, dựng database và tài khoản riêng theo database/README.md, tạo `.env` của họ rồi chạy `npm run db:setup` và `npm start`. Không chia sẻ `.env` hay mật khẩu root. Mỗi máy có dữ liệu độc lập; Git đồng bộ code/schema/seed, không đồng bộ dữ liệu MySQL đã chỉnh.
- Người truy cập website: chỉ mở URL, trình duyệt gọi Node API; không cần cài MySQL. Khi deploy, server và database phải online, server dùng biến môi trường riêng để kết nối database dùng chung. Database ở máy cá nhân không tự đi theo code lên Vercel.
- Nếu nhóm cần dữ liệu chung, dùng một môi trường dev/staging được quản lý và tài khoản phù hợp, không công khai cổng database máy cá nhân.

### Lấy branch backend về máy thành viên

```powershell
git clone --branch Update-web-5.0 https://github.com/GabTommy2006/hom_nay_an_gi.git
cd hom_nay_an_gi
npm ci
```

Nếu đã clone repo, dùng `git fetch origin` rồi chuyển sang `Update-web-5.0`; giữ lại hoặc commit thay đổi cá nhân trước khi chuyển branch. Sau đó làm theo [hướng dẫn database](database/README.md): tạo database/tài khoản, sao chép `.env.example` thành `.env`, điền mật khẩu riêng và chạy `npm run db:setup`. Khi hoàn tất, chạy `npm start`.

## Thêm/sửa quán thật

Trên Update-web-5.0, chạy `npm run db:setup` để áp dụng migration 003, cấp quyền thay liên kết bữa và thao tác theo [docs/RESTAURANT-ADMIN.md](docs/RESTAURANT-ADMIN.md). Chỉ admin được ghi; dữ liệu được kiểm tra ở server, có revision chống ghi đè và lịch sử sửa. Chưa có chức năng xóa quán.
## Quản trị món ăn

Admin đã có thể thêm/sửa món và bữa gợi ý, lưu thật vào MySQL. Xem [hướng dẫn món ăn](docs/DISH-ADMIN.md) để áp dụng migration và cấp quyền cho database riêng. Các cấu hình Aiven và mật khẩu chỉ nằm trong `.env` riêng, không đi kèm repository.

## Quản trị danh mục đầy đủ

Xem [hướng dẫn liên kết, công thức và căn cứ nhãn](docs/ADMIN-CATALOG.md). Chạy `npm run db:setup` trên database riêng sau khi lấy code để áp dụng đủ 26 bảng; cấu hình và dữ liệu Aiven không tự đi theo Git. Tài khoản người dùng/đồng bộ Yêu thích và triển khai Vercel để giai đoạn sau.

Món ăn và quán hỗ trợ [ẩn/hiện trong admin](docs/VISIBILITY.md), lưu thật và có bộ lọc trạng thái. Migration `006-catalog-visibility` giữ mặc định hiện cho dữ liệu cũ; không xóa công thức, nhãn, liên kết hoặc mục yêu thích khi ẩn.

## Vercel

Xem [hướng dẫn triển khai](docs/VERCEL.md). Backend dùng Node Function chung để giữ phân quyền admin và trạng thái ẩn/hiện; database vẫn ở Aiven. Không chạy seed hoặc migration trong bước build.
