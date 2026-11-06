# Triển khai Vercel

Node.js 24, framework Other. `api/index.js` dùng lại request handler MVC, không mở cổng HTTP riêng trên Vercel. `npm run build:vercel` chỉ chuẩn bị output; không tạo schema, seed hay sửa database lúc build.

Toàn bộ request đi qua Function; thư mục public được đóng gói bằng includeFiles, không xuất thẳng admin.html và các bản seed data.js/recipes.js lên CDN. Điều này giữ kiểm tra admin và trạng thái ẩn/hiện trên bản online. Output tĩnh dist được để trống.

## Biến môi trường

Đặt riêng trên Vercel, không commit file chứa giá trị thật:

- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Aiven đang dùng.
- DB_SSL_CA: toàn bộ PEM của CA, giữ các dòng BEGIN/END CERTIFICATE và xuống dòng.
- BETTER_AUTH_SECRET: chuỗi ngẫu nhiên riêng ít nhất 32 ký tự, không đổi mỗi deployment.
- BETTER_AUTH_URL: origin HTTPS chính xác của website production, không thêm đường dẫn.
- NODEJS_HELPERS=0: bắt buộc giữ body stream gốc để kiểm tra JSON, dung lượng và đăng nhập.
- NODE_ENV=production nếu môi trường chưa tự thiết lập.

Không sao chép HOST/PORT local làm cấu hình mạng của Function. Không đưa DB_PASSWORD hoặc BETTER_AUTH_SECRET vào biến có tiền tố public. NODEJS_HELPERS được cấu hình trong môi trường build/runtime theo [hướng dẫn Node.js của Vercel](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration).

MySQL pool dùng lại theo instance và gắn attachDatabasePool khi chạy trên Vercel. Giới hạn 2 kết nối/instance, maxIdle=0 và idleTimeout=1000 để đóng kết nối rảnh. mysql2 chỉ bật bộ dọn kết nối khi maxIdle nhỏ hơn connectionLimit; đặt bằng nhau có thể gây ER_CON_COUNT_ERROR trên Aiven khi các instance tích lũy kết nối. Nhiều instance vẫn cùng dùng chung giới hạn kết nối Aiven. Region bom1 được chọn gần dịch vụ Aiven tại Bangalore. Xem [connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions).

## Git và cập nhật

Bản triển khai dùng nhánh Update-web-6.0, không đổi nội dung các nhánh backup. Repository có main cũ nên cần chọn đúng nhánh khi triển khai, không mặc định dùng main. Không tự chạy db:setup trên production mỗi lần push; migration phải được kiểm tra và thực hiện riêng có sao lưu.

## Kiểm tra sau triển khai

Mở trang chủ, danh mục món/quán, công thức và kết quả quay; xác minh dữ liệu đến từ Aiven. Mở admin.html khi chưa đăng nhập phải chuyển về đăng nhập, API admin trả 401. Đăng nhập tài khoản admin hiện có, kiểm tra phiên/cookie HTTPS và đăng xuất. Kiểm tra ghi bằng mục thử riêng rồi xóa sạch mục thử; không dùng dữ liệu thật của quán để thử.

Preview có thể được Vercel bảo vệ bằng tài khoản; không xem 401/403 của Vercel là lỗi đăng nhập website. Khi đổi domain, cập nhật BETTER_AUTH_URL và redeploy. Yêu thích vẫn lưu theo origin/trình duyệt, không tự đồng bộ từ localhost sang domain mới.
