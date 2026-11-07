# Admin thêm/sửa quán lưu MySQL

Phạm vi đợt này: thêm và sửa quán thật bằng API có quyền admin. Giao diện giữ bố cục cũ. Các mục món ăn, liên kết, công thức và rà soát nhãn vẫn là bản nháp cục bộ; chưa có API xóa quán.

## Thiết lập cho thành viên

1. Lấy code trên Update-web-5.0, chạy `npm ci`.
2. Cấu hình `.env`, đăng nhập/admin theo `docs/AUTH.md`.
3. Chạy `npm run db:setup`: áp dụng migration `003-restaurant-writes`, không ghi đè danh mục đã nhập.
4. Tài khoản MySQL cần SELECT/INSERT/UPDATE trên restaurants, SELECT/INSERT/DELETE trên restaurant_meals và SELECT/INSERT trên restaurant_audit. Tài khoản hnag_import đã có quyền INSERT/UPDATE toàn database từ giai đoạn setup; quản trị viên chạy thêm bằng root:

```sql
GRANT DELETE ON hom_nay_an_gi.restaurant_meals
TO 'hnag_import'@'localhost';
```

Không cấp quyền xóa quán. Với tài khoản runtime riêng, cấp quyền theo từng bảng ngoài quyền session/rate-limit đã hướng dẫn ở AUTH.md. Server không tự nâng quyền tài khoản MySQL.

5. `npm start`, đăng nhập admin, mở mục Quán ăn. Nút trong form là **Lưu thay đổi**; sau khi lưu có thể mở trang Quán ăn hoặc chi tiết quán để kiểm tra.

## Dữ liệu và hành vi

- Bắt buộc tên, địa chỉ, khu vực và nhóm món. Khu vực do admin nhập, không tự gán Đà Nẵng cho mọi quán mới.
- Bữa gợi ý nhập tên `Sáng, Trưa, Chiều, Tối, Khuya`, cách nhau bằng dấu phẩy. Form chuyển tên bữa sang mã API tương ứng. Để trống khi chưa biết; không tự gán bữa từ tên quán.
- Mức giá để lọc tách khỏi khoảng giá tham khảo. Chưa có thông tin thì để trống; không suy khoảng giá của quán thành giá từng món.
- Website/ảnh/link đặt món phải là HTTPS, không chứa username/password. GrabFood chỉ nhận food.grab.com, ShopeeFood chỉ nhận shopeefood.vn/www.shopeefood.vn.
- Điện thoại và giờ mở cửa chỉ xuất hiện trên trang chi tiết khi admin đã nhập. Website không tự xác minh tính đúng của thông tin do admin cung cấp.
- Ảnh thay thế ghi rõ là ảnh do quản trị viên cung cấp. Nếu xóa URL thay thế, ảnh nguồn ban đầu được giữ lại; quán mới không có ảnh thì dùng placeholder. Không tự gọi ảnh cung cấp là ảnh chính thức của quán.
- Link giao đồ ăn được lưu để quản trị, chưa tự xuất bản nút đặt món cho chi nhánh khi chưa xác minh. `partnership` chỉ có unknown/draft-partner, không tự xác nhận đối tác.
- Note và trạng thái đề xuất hợp tác là dữ liệu nội bộ, không trả trong API quán công khai.
- Quán mới có ID `r-UUID`; ID quán cũ không đổi. Quán mới chưa tự liên kết với món; đó là bước quản trị liên kết tiếp theo.

## Lưu an toàn

- Mọi request phải có phiên hợp lệ, role admin, Origin cùng website và JSON giới hạn 16 KiB. Server kiểm tra độc lập với form.
- POST `/api/admin/restaurants` tạo mới; `requestId` UUID do form tạo giữ nguyên khi thử lại, tránh tạo hai quán khi mất phản hồi mạng. Cùng requestId khác nội dung/khác người tạo bị từ chối.
- GET `/api/admin/restaurants?page=1&pageSize=48` lấy dữ liệu form và revision, chỉ admin được xem.
- PUT `/api/admin/restaurants/:id` cập nhật đầy đủ các trường form, cần `revision` từ bản đọc trước. Nếu đã bị sửa, server trả 409, giữ form để người dùng đối chiếu; đóng form và tải lại danh sách trước khi sửa tiếp.
- Quán, liên kết bữa và lịch sử được ghi trong một transaction. Nếu bất kỳ bước nào lỗi, rollback toàn bộ.
- `restaurant_audit` ghi ai tạo/sửa, thời điểm và dữ liệu trước/sau. `source_record` và nguồn ảnh gốc không bị viết lại theo nội dung mới. Quán đã sửa có verification admin-updated, không được tự đánh dấu verified.
- Khi lưu, nút bị khóa để tránh bấm lặp; nếu mất kết nối, nội dung đang nhập vẫn còn. Chỉ báo thành công sau khi API đọc lại bản lưu.
- Bản nháp quán từ giai đoạn cũ được giữ trong localStorage nhưng không tự ghi lên MySQL, không đè thông tin mới từ server. Admin hiển thị thông báo nếu còn bản nháp cũ; có thể sao lưu/đối chiếu chúng trước khi dùng chức năng xóa nháp. Các loại nháp khác tiếp tục hoạt động như trước.

## Kiểm thử

`npm test`: kiểm tra 401/403, CSRF, dữ liệu sai, URL không hợp lệ, bữa, tạo mới, thử lại cùng yêu cầu, sửa theo revision, hai người cùng sửa, rollback khi liên kết lỗi, bảo toàn nguồn và cập nhật qua API công khai. Dữ liệu giả chỉ nằm trong instance MySQL tạm, không thêm vào database đang dùng.

Kiểm tra trình duyệt ở điện thoại/desktop: đăng nhập → thêm → tải lại → sửa → trang chi tiết → danh sách công khai. Kiểm thử trên database tạm riêng.

Đã có bản backup dữ liệu trước giai đoạn ghi thật ở máy chủ dự án; mỗi thành viên nên tự backup database riêng trước khi áp dụng migration hoặc thử chỉnh dữ liệu quan trọng. Backup database, `.env`, password và auth secret không được commit vào Git.
