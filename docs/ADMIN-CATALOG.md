# Quản trị liên kết, công thức và căn cứ nhãn

Admin hiện lưu thật quán, món, liên kết món–quán, công thức và căn cứ nhãn vào MySQL. Mục Tài khoản vẫn chỉ đọc danh sách và vai trò. Không có đăng ký người dùng, đồng bộ Yêu thích, quản lý đơn hàng hay tích hợp shipper trong đợt này.

## Cập nhật database riêng

Sau khi lấy code, dùng `.env` riêng và chạy `npm run db:setup`. Migration `005-admin-catalog` thêm `admin_catalog_versions` và `admin_catalog_audit`, tổng 26 bảng sau các migration trước. Không nhập đè danh mục đã có. Cần chạy trên mỗi database riêng; database local dự phòng chưa tự cập nhật theo Aiven.

Tài khoản migration cần quyền tạo bảng, REFERENCES và ghi schema_versions. Runtime cần SELECT trên danh mục, quyền auth/quán/món đã hướng dẫn, kèm:

```sql
GRANT INSERT, UPDATE, DELETE ON hom_nay_an_gi.restaurant_dishes TO 'hnag_app'@'%';
GRANT INSERT, UPDATE, DELETE ON hom_nay_an_gi.recipes TO 'hnag_app'@'%';
GRANT INSERT, DELETE ON hom_nay_an_gi.recipe_ingredients TO 'hnag_app'@'%';
GRANT INSERT, DELETE ON hom_nay_an_gi.recipe_steps TO 'hnag_app'@'%';
GRANT INSERT, DELETE ON hom_nay_an_gi.dish_reviews TO 'hnag_app'@'%';
GRANT INSERT, DELETE ON hom_nay_an_gi.dish_nutrition_profiles TO 'hnag_app'@'%';
GRANT INSERT, UPDATE ON hom_nay_an_gi.admin_catalog_versions TO 'hnag_app'@'%';
GRANT INSERT ON hom_nay_an_gi.admin_catalog_audit TO 'hnag_app'@'%';
```

Thay tài khoản và host bằng giá trị thực tế. `%` là ví dụ tài khoản cloud; không mở dịch vụ MySQL local ra Internet. Mật khẩu và backup có dữ liệu xác thực không đưa vào Git.

## Món tại quán

- Chọn đúng món và đúng chi nhánh. Khi sửa không đổi cặp món–quán; muốn đổi, ngừng công bố cặp cũ rồi tạo cặp mới.
- Phân biệt `dish` (đã đối chiếu bán đúng món) và `related` (món liên quan). Liên kết related không được tính là quán bán chính xác món đó.
- Giá là số nguyên VND cho một phần, chưa biết để trống. Không lấy khoảng giá quán làm giá món.
- Bắt buộc tên phiên bản trong thực đơn, URL nguồn HTTPS và căn cứ/ngày đối chiếu. Admin chịu trách nhiệm đối chiếu thực đơn thật; server không tự chứng nhận nội dung URL.
- Ngừng công bố sẽ gỡ khỏi kết quả quán liên quan; nội dung vẫn có trong admin để khôi phục.

## Công thức

Chọn món chưa có công thức để thêm. Tên hiển thị theo tên món, mỗi món một công thức đang quản lý.

Nguyên liệu nhập mỗi dòng một mục:

```text
Gạo nếp | 200 | g
Nước cốt dừa | 100–150 | ml
Muối | Một ít
```

Số dương, tối đa 4 chữ số thập phân, khoảng không được đảo ngược. Số lượng số/khoảng tiếp tục đổi theo khẩu phần; lượng văn bản giữ nguyên. Mỗi bước nhập `Tiêu đề | Nội dung`. Bắt buộc thời gian chuẩn bị/nấu, nguồn có tên và URL; có thể thêm ngâm/ủ và lưu ý.

Ngừng công bố gỡ công thức khỏi website/bộ lọc Có công thức, nhưng giữ nội dung trong admin để khôi phục. Bản chụp nguồn gốc được giữ trong lịch sử.

Khi lưu công thức, nhãn ăn chay có trạng thái reviewed của món được thu hồi và ghi lịch sử để yêu cầu rà soát lại; không để nhãn cũ xác nhận một phiên bản vừa thay nguyên liệu. Nhãn source-declared và dinh dưỡng vốn giới hạn ở nguồn tham khảo riêng không tự biến thành xác nhận công thức mới.

## Duyệt thông tin

Danh sách có tất cả món, lọc Có căn cứ nhãn / Chưa gán nhãn. Mỗi lần lưu thay toàn bộ căn cứ của đúng món trong một transaction.

- Ăn chay: cần chọn mức xác minh, ghi phạm vi/điều kiện, nguyên liệu, URL thành phần và ngày rà soát. Không suy đoán từ tên món. Mức source-declared vẫn thông báo chưa xác minh độc lập.
- Dinh dưỡng: cần đúng phiên bản nguồn, khẩu phần với g/ml, năng lượng/đường/carbohydrate cả khẩu phần, nguồn và giới hạn số liệu. Server chuẩn hóa theo 100 g hoặc 100 ml và từ chối nhãn vượt ngưỡng.
- Tiêu chí tham khảo từ [European Commission](https://food.ec.europa.eu/food-safety/labelling-and-nutrition/nutrition-and-health-claims/nutrition-claims_en): ít đường ≤5 g/100 g thức ăn rắn hoặc ≤2,5 g/100 ml đồ uống; ít năng lượng ≤40 kcal/100 g hoặc ≤20 kcal/100 ml. Không xem đây là chứng nhận pháp lý cho suất ăn tại Việt Nam.
- Chưa hỗ trợ công bố nhãn ít tinh bột qua form khi chưa có tiêu chí thích hợp.
- Chọn Không gán để thu hồi nhãn. Bắt buộc xác nhận đã đối chiếu trước khi lưu; không tự tìm nguồn hoặc tự gán nhãn mới cho danh mục hiện có.

## API và tính nhất quán

`GET /api/admin/{links|recipes|reviews}` trả danh sách có revision. `POST` tạo liên kết/công thức; `PUT /api/admin/{kind}/{encodeURIComponent(id)}` sửa. ID liên kết là `dishId/restaurantId`; công thức và căn cứ dùng dishId. Căn cứ được chỉnh bằng PUT vì danh sách bao gồm mọi món.

Mỗi yêu cầu ghi có requestId UUID v4; sửa cần revision hiện có. Retry cùng mã/nội dung/người sửa không ghi lặp; dùng lại mã với nội dung khác hoặc revision cũ trả 409. Có kiểm tra admin lại trong transaction, giới hạn JSON 128 KiB, whitelist trường, CSRF/Origin và HTTPS cho nguồn. Mỗi lần sửa lưu bản trước/sau cùng người sửa. Ngừng công bố có thể khôi phục trong form, không cung cấp API xóa hàng loạt.

Các bản nháp localStorage cũ được giữ để đối chiếu, không còn trộn vào danh sách thật. Không có chức năng nhập tự động bản nháp. Yêu thích của khách vẫn ở localStorage theo phạm vi đã chốt.

## Kiểm thử

`npm test` chạy auth, validation, CRUD, ngừng công bố/khôi phục, bảo toàn định lượng, xung đột, rollback và thu hồi nhãn sau sửa công thức trên MySQL tạm. `npm run test:db` kiểm tra sâu schema/import 26 bảng. Kiểm tra giao diện máy tính/điện thoại dùng tài khoản và database tạm, không gán nhãn giả lên Aiven.
