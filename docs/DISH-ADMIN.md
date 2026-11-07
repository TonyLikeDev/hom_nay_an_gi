# Thêm/sửa món ăn

Admin đăng nhập có thể thêm và sửa món tại `admin.html#dishes`. Lưu cập nhật MySQL, danh sách món và tập món dùng để quay; tải lại các trang công khai đang mở để nhận dữ liệu mới.

## Cài đặt cho thành viên

Sau khi lấy code, cấu hình `.env` riêng rồi chạy `npm run db:setup`. Migration `004-dish-writes` bổ sung revision, admin_image_url, updated_at và dish_audit; tổng 24 bảng. Không ghi đè dữ liệu danh mục đã nhập. Cần chạy migration trên từng database riêng, kể cả database local khi quay lại cấu hình dự phòng.

Tài khoản migration cần CREATE, ALTER, REFERENCES và quyền đọc/ghi phiên bản schema. Tài khoản runtime cần SELECT trên danh mục và quyền auth hiện có, kèm:

```sql
GRANT INSERT, UPDATE ON hom_nay_an_gi.dishes TO 'hnag_app'@'%';
GRANT INSERT, DELETE ON hom_nay_an_gi.dish_meals TO 'hnag_app'@'%';
GRANT INSERT ON hom_nay_an_gi.dish_audit TO 'hnag_app'@'%';
```

Thay tên/host bằng tài khoản thực tế. Host `%` ở ví dụ dành cho kết nối cloud; không mở quyền tài khoản local ra Internet. Không đưa .env, mật khẩu hay file sao lưu vào Git.

## API

- GET `/api/admin/dishes`: danh sách có revision và URL ảnh thay thế riêng.
- POST `/api/admin/dishes`: name, cuisine, desc, imageUrl, meals, requestId UUID v4.
- PUT `/api/admin/dishes/:id`: các trường trên, dùng revision thay requestId.

Tên và ẩm thực bắt buộc; chọn ít nhất một bữa hợp lệ. Mô tả tối đa 5.000 ký tự, tên 255, URL ảnh 2.000, HTTPS không chứa thông tin đăng nhập. URL trống dùng lại ảnh gốc, hoặc ảnh chờ nếu món chưa có ảnh. Không tải ảnh lên server, không tự tìm hay xác nhận quyền sử dụng ảnh.

Mỗi lần lưu là một transaction gồm món, bữa ăn và nhật ký người sửa. Yêu cầu lặp khi tạo cùng nội dung không tạo thêm món; revision cũ trả 409. Không cho sửa ID, nguồn gốc, nhãn ăn chay/dinh dưỡng, công thức hoặc liên kết quán qua API này. Công thức và liên kết được giữ theo ID món.

Không có chức năng ẩn/xóa món trong đợt này. Bản nháp món cũ vẫn được giữ ở localStorage và thông báo rõ, không tự nhập hoặc ghi đè dữ liệu thật. Các phần công thức, liên kết, rà soát vẫn là bản nháp.

## Kiểm chứng

`npm test` kiểm tra bằng MySQL tạm: đăng nhập/phân quyền, CSRF, dữ liệu không hợp lệ, nhập lặp, sửa trực tiếp, xung đột đồng thời, rollback và giữ nguồn/nhãn/công thức. `npm run test:db` kiểm tra sâu quy trình schema/import. Không chạy các test này trên Aiven hoặc database local đang sử dụng.
