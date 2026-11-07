# Hướng dẫn phát triển

## Kiến trúc và quy ước

Frontend HTML/CSS/JS gọi API cùng tên miền. Dự án chia theo MVC: public/ là View; server/routes/ ánh xạ URL sang controller; server/controllers/ nhận yêu cầu và trả JSON; server/models/ đọc/lọc dữ liệu. Khi nghiệp vụ phức tạp, thêm server/services/ và server/middleware/ cho xác thực, phân quyền, kiểm tra dữ liệu.

Bộ khung dùng HTTP server có sẵn của Node.js để chạy ngay. Trước khi làm đăng nhập/upload, có thể chuyển tầng HTTP sang Express và dùng middleware được duy trì. Không tự viết thuật toán băm mật khẩu hoặc cơ chế phiên đăng nhập.

Chỉ public/ được phục vụ như file tĩnh. Không đặt mật khẩu, database dump hoặc khóa API trong thư mục này. .env nằm ở gốc, không commit.

## 1. Nối database thật

Đã dùng MySQL 8.4 LTS, pool mysql2 tại server/config/database.js và cấu hình riêng trong .env. Xem database/README.md để setup. Model đọc MySQL; không có fallback JSON khi kết nối lỗi. API trả 503, log chỉ có mã lỗi, không in truy vấn hoặc thông tin đăng nhập.

Giữ hợp đồng dữ liệu hiện tại: id, name, cuisine, meals, desc, photo, by và crop tùy chọn. Ánh xạ tên cột tại model. Giữ ID như pho-bo ổn định vì các URL hiện có dùng ID này. Nếu dùng ID số, thêm slug và xử lý ánh xạ rõ ràng.

API công khai chỉ trả dữ liệu đã xuất bản và các trường được phép xem. Khi dữ liệu lớn, thêm phân trang; quay ngẫu nhiên cần endpoint riêng hoặc tập ID đầy đủ, tránh chỉ quay trên trang đầu.

## 2. Chuyển frontend sang fetch

Hiện server tạo const FOOD và const RECIPES từ MySQL để giữ các script đồng bộ cũ chạy được. Khi chuyển toàn bộ trang sang API mới bỏ cơ chế này và file data.js cũ.

Tạo public/js/api.js với hàm gọi fetch, kiểm tra response.ok và trả JSON. Trang gọi hàm trong async init(), hiển thị đang tải, await dữ liệu rồi mới render và kích hoạt nút quay. Xử lý danh sách rỗng, lỗi mạng và thử lại.

Nếu dùng import/export, đổi script tương ứng sang type="module" và xử lý các biến global hiện tại có chủ đích. Thêm API cho ẩm thực/bữa ăn vì các trang còn dùng FOOD.CUISINES và FOOD.MEALS.

Dùng textContent cho dữ liệu văn bản. Rà soát các chỗ innerHTML trước khi nhận nội dung admin; không ghép trực tiếp dữ liệu không tin cậy thành HTML.

## 3. Công thức

Các bảng đề xuất, cần điều chỉnh theo database thật:

- dishes: món, slug, nền ẩm thực, mô tả, ảnh, trạng thái xuất bản.
- recipes: dish_id, tiêu đề, khẩu phần, phút chuẩn bị, phút nấu, nguồn.
- recipe_ingredients: recipe_id, tên, lượng, đơn vị, position.
- recipe_steps: recipe_id, position, hướng dẫn, ảnh tùy chọn.
- dish_meals: quan hệ món với bữa ăn.

Thêm recipe.html?dish=pho-bo. API chi tiết trả công thức đã xuất bản, nguyên liệu và các bước theo position. Một món có thể có nhiều công thức; cần chọn rõ công thức mặc định hoặc hiển thị danh sách.

Kiểm tra độ dài, số lượng bước/nguyên liệu, thời gian không âm và khóa ngoại. Lưu công thức cùng nguyên liệu/các bước trong transaction để tránh dữ liệu thiếu một phần.

Ảnh lưu trong kho lưu trữ bền vững, database lưu URL/key. Hiện photo là ID Unsplash; khi thêm ảnh upload, thêm imageUrl và sửa App.photo() để ưu tiên URL hợp lệ. Kiểm tra nội dung, định dạng, kích thước file và tạo tên file phía server.

## 4. Admin

Đã triển khai đăng nhập, đăng xuất, phiên và phân quyền; xem docs/AUTH.md. Các route ghi danh mục bên dưới là định hướng, chưa triển khai:

- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET /api/admin/dishes
- POST /api/admin/dishes
- PUT /api/admin/dishes/:id
- POST /api/admin/uploads

Trang quản lý có thể đặt tại public/admin/. Mọi API dữ liệu riêng/ghi dữ liệu đều phải kiểm tra quyền phía server; giấu nút không bảo vệ được API.

Dùng thư viện phiên đăng nhập, kho phiên bền vững, cookie HttpOnly, Secure khi có HTTPS và SameSite phù hợp. Băm mật khẩu bằng thư viện chuyên dụng, giới hạn thử đăng nhập và bảo vệ CSRF cho API ghi dùng cookie. Quyền lấy từ server, không lấy từ role do trình duyệt gửi.

Form gồm thông tin món, nguyên liệu, bước nấu, ảnh, lưu nháp và xuất bản. Ưu tiên ẩn món thay vì xóa mất. Sau khi lưu, đọc lại qua API để kiểm tra.

## 5. Link đặt đồ ăn

Tạo dish_order_links: dish_id, platform, merchant_name, area, url, enabled. Một món có nhiều quán/chi nhánh.

Admin nhập link thật. Server kiểm tra HTTPS và hostname chính xác trong danh sách cho phép đã xác minh, không kiểm tra bằng chuỗi contains. Link mở tab mới có rel="noopener noreferrer". Không có link thì không hiện nút có thể bấm.

Bản này chuyển người dùng sang nền tảng đặt món; không đồng bộ giá, phí ship hoặc đơn hàng. API đối tác chỉ triển khai khi đã có quyền truy cập và tài liệu phù hợp. Khóa truy cập luôn nằm phía server.

## 6. Thứ tự và kiểm tra

1. Nối database: danh sách/chi tiết đúng dữ liệu, giữ ID và không lộ cột nội bộ.
2. Đổi frontend sang API: tải/lỗi/rỗng/lọc/quay món hoạt động.
3. Công thức: nguyên liệu/bước đúng thứ tự; có thông báo khi chưa có công thức.
4. Admin: chưa đăng nhập không ghi được; người không có quyền bị từ chối; bản nháp không công khai.
5. Upload và link: từ chối file/URL sai; hiển thị ảnh và mở đúng quán.
6. Deploy: HTTPS, biến môi trường, sao lưu database và kho ảnh bền vững.

Không cần giỏ hàng/thanh toán riêng để hoàn thành luồng chọn món → xem công thức hoặc mở quán đặt món.

## Cấu trúc MVC đã chuẩn bị

```text
public/                          View đang dùng: HTML/CSS/JS
server/
  app.js                         Khởi tạo server và phục vụ website
  config/                        Cấu hình, kết nối database sau này
  routes/dish.routes.js           Ánh xạ URL/method sang controller
  controllers/dish.controller.js  Nhận yêu cầu và trả JSON
  models/                        Đọc/lọc dữ liệu; truy vấn database sau này
  services/                      Nghiệp vụ phối hợp nhiều model
  middleware/                    Xác thực, phân quyền, xử lý lỗi
  validators/                    Kiểm tra dữ liệu đầu vào
  utils/                         Hàm hỗ trợ dùng chung
  views/                         Dành sẵn cho template, chưa sử dụng
database/                       Migrations và seeds (ở gốc dự án)
scripts/                         Công cụ nhập dữ liệu/bảo trì
tests/                           Kiểm thử khi triển khai backend
data/food.json                   Dữ liệu mẫu đang sử dụng
```

Luồng hiện tại: View → Route → Controller → Model → MySQL → phản hồi JSON → View.
Khi có nghiệp vụ phức tạp: Route → Middleware/Validator → Controller → Service → Model.

Các thư mục mới là bộ khung có tài liệu, chưa có đăng nhập, kết nối database, API ghi hoặc service nghiệp vụ. Không có một cấu trúc MVC duy nhất bắt buộc cho Node.js; dự án dùng quy ước trên để phân chia trách nhiệm nhất quán.

View thực tế nằm trong public/. server/views/ chỉ dành sẵn nếu sau này chọn render template phía server; không sao chép HTML sang đó và không cần cài EJS. Mỗi module mới dùng tên nhất quán, ví dụ recipe.routes.js, recipe.controller.js, recipe.model.js; chỉ thêm recipe.service.js khi có nghiệp vụ cần tách.

Khi chọn database, thêm server/config/database.js và gọi từ model. Không giữ thêm tầng repositories trùng trách nhiệm với model ở quy mô hiện tại.
