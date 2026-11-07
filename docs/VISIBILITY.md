# Ẩn/hiện món ăn và quán

Trong Admin → Món ăn hoặc Quán ăn, mở Chỉnh sửa, chọn Hiện hoặc Ẩn ở đầu form rồi Lưu thay đổi. Bộ lọc hỗ trợ Tất cả hiển thị, Đang hiện và Đang ẩn. Bảng ghi rõ trạng thái.

## Dữ liệu và phạm vi

- `006-catalog-visibility` thêm `is_visible` vào dishes và restaurants, mặc định TRUE. Mọi dữ liệu hiện có giữ trạng thái công khai ban đầu; không xóa hoặc ẩn hàng loạt.
- Chạy `npm run db:setup` trên database riêng sau khi lấy code. Tổng vẫn 26 bảng. Khi dùng lại MySQL local dự phòng, áp dụng migration tại local trước khi chạy code mới; dữ liệu local không tự đồng bộ từ Aiven.
- Ẩn món không xóa ảnh, nguyên liệu, bước nấu, nguồn nhãn, liên kết quán hay ID yêu thích. Admin vẫn đọc/sửa được toàn bộ và có thể hiện lại.
- Ẩn quán không xóa quán hoặc liên kết; quán không còn trong danh sách công khai, gợi ý tại món và số quán đang công khai dùng cho bộ lọc Có quán.
- Ẩn món loại món khỏi dữ liệu công khai, danh sách/quay và công thức công khai. Đường API chi tiết trả 404 như mục không có, kể cả khi request mang cookie admin. Truy cập quản trị dùng endpoint admin riêng.
- Khi hiện lại, dữ liệu liên quan được dùng lại. Công thức/liên kết vốn đã Ngừng công bố vẫn giữ trạng thái riêng đó; ẩn/hiện cha không tự bật chúng.
- Ảnh đại diện ẩm thực dùng món đang hiện thay thế nếu ảnh bìa cũ bị ẩn; không còn món công khai thì ẩm thực đó tạm không nằm trong danh sách công khai. Admin vẫn có đủ các nền ẩm thực.
- Các ID Yêu thích lưu trên trình duyệt được giữ nguyên. Mục đang ẩn có thông báo chưa công khai; hiện lại và tải lại trang sẽ thấy lại mục đã lưu.

Các trang khách đang mở cần tải lại để nhận dữ liệu mới; đây không phải chức năng cập nhật trực tiếp qua WebSocket. Hai script dữ liệu sinh từ database dùng Cache-Control no-store.

## API và phân quyền

`GET /api/admin/dishes` và `GET /api/admin/restaurants` trả `isVisible` dạng boolean và revision, gồm cả mục ẩn. Món trả thêm danh mục ẩm thực/bữa ăn để admin chỉnh sửa được kể cả khi toàn bộ món đang ẩn.

`POST/PUT` món/quán nhận thêm `isVisible` boolean; chuỗi, số và null bị từ chối. Nếu client cũ không gửi trường này, khi sửa sẽ giữ trạng thái hiện có, khi tạo mặc định hiện. Revision cũ bị từ chối bằng 409, tránh form cũ vô tình công bố lại mục đang ẩn.

Lưu trạng thái trong cùng transaction với nội dung và nhật ký dish_audit/restaurant_audit. Chỉ admin được ghi, vẫn kiểm tra Origin/CSRF. Không cần quyền DELETE hoặc tài khoản mới cho tính năng này; dùng quyền UPDATE món/quán và INSERT nhật ký hiện có. Tài khoản chạy migration cần ALTER và ghi schema_versions.

Không có tham số `admin=true` công khai để xem mục ẩn. API admin đòi phiên có role admin, kiểm tra lại role tại lúc ghi. Các mục liên kết/công thức/căn cứ trong admin hiển thị “Ẩn theo món/quán” nếu cha đang ẩn, không tự sửa dữ liệu hoặc trạng thái công bố riêng.

## Kiểm thử

`npm test` kiểm tra mặc định hiện, lưu ẩn/hiện qua API, tải lại, sửa không gửi flag, xung đột revision, boolean sai, quyền admin/CSRF, giữ nguyên nguồn/công thức/nhãn/liên kết/số dòng, ảnh bìa ẩm thực và danh mục rỗng. Runner không đọc .env, tạo MySQL TEMP riêng trên cổng loopback ngẫu nhiên; trước khi chạy test xác minh @@datadir đúng thư mục tạm và từ chối Aiven/cổng 3306.

`npm run test:db` kiểm tra sâu migration/import trong instance tạm riêng. Kiểm tra giao diện ở 1440px và 390px, gồm ẩn, tải lại, lọc, hiện lại và phục hồi từ danh mục không còn món công khai.
