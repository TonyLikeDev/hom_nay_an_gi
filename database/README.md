# Database MySQL 8.4 LTS

Schema và seed đã có; Model/API, FOOD và RECIPES hiện đọc MySQL, giao diện giữ nguyên. Đã có đăng nhập/phân quyền admin thật; không tạo admin mẫu và không tự chuyển yêu thích/bản nháp localStorage vào database.

## Dữ liệu nguồn

- `data/food.json`: 105 món, 7 nhóm ẩm thực, 5 bữa ăn.
- `data/restaurants.json`: 105 quán, nguồn dữ liệu, nguồn ảnh và mức xác minh.
- `data/dish-restaurants.json`: 109 liên kết; 106 `dish` và 3 `related`. Liên kết `related` không xác nhận bán đúng món. Giá riêng từng món chưa có nên để NULL.
- `public/js/recipes.js`: 14 công thức, 158 nguyên liệu và 56 bước. Script đọc constant do dự án quản lý, không thực thi file tải lên tùy ý.
- 11 căn cứ ăn chay, 4 đánh giá dinh dưỡng trên 3 món. Giữ nguyên phạm vi phiên bản tham khảo và nguồn; không gán thành nhãn chung cho suất ăn của quán.
- `data/nutrition-research.json`: giữ nguyên tài liệu nghiên cứu, kể cả các món chưa đủ điều kiện gán nhãn.

## Các bảng

`schema.sql` có 18 bảng InnoDB cho danh mục; migration `002-admin-auth` bổ sung 4 bảng xác thực:

- `meals`, `cuisines`, `dishes`, `dish_meals`: danh mục món.
- `restaurants`, `restaurant_meals`, `restaurant_dishes`: quán, bữa gợi ý và liên kết món–quán.
- `recipes`, `recipe_ingredients`, `recipe_steps`: công thức; thứ tự nguyên liệu/bước, định lượng cố định, khoảng định lượng và văn bản như “Một ít”.
- `dish_reviews`, `dish_nutrition_profiles`: căn cứ và số liệu gắn đúng món/phiên bản.
- `users`, `favorite_dishes`, `favorite_restaurants`: cấu trúc chuẩn bị cho giai đoạn tài khoản; hiện để trống.
- `schema_versions`, `seed_imports`, `dataset_documents`: phiên bản schema, dấu vết nhập và tài liệu nguồn.

Cột `source_record` là bản chụp dữ liệu nguồn để kiểm toán/đối chiếu, không phải cột để chỉnh nội dung vận hành sau này. Các trường phục vụ truy vấn chính đã tách thành cột và bảng quan hệ. `linkedRestaurantCount` không lưu thành cột đếm riêng: sẽ tính từ liên kết `match_type='dish'` để tránh lỗi đồng bộ.

`Cả ngày` được mở rộng ra 5 bữa trong `restaurant_meals`; cách ghi gốc vẫn được giữ trong `source_record`. Nguồn Excel chỉ là provenance nội bộ, không thêm lại vào UI công khai.

## 1. Kiểm tra trước khi kết nối

```powershell
npm install
npm run db:check
npm test
```

`db:check` không cần mật khẩu, không kết nối database và không ghi dữ liệu.

## 2. Tạo database và tài khoản nhập riêng bằng Workbench

Đăng nhập root, chạy đoạn SQL sau. Thay chuỗi mật khẩu minh họa bằng mật khẩu riêng; không lưu mật khẩu thật vào repo. Không chạy trên database có sẵn của hệ thống khác.

```sql
CREATE DATABASE IF NOT EXISTS hom_nay_an_gi
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

CREATE USER 'hnag_import'@'localhost'
  IDENTIFIED BY 'THAY_BANG_MAT_KHAU_RIENG';

GRANT SELECT, INSERT, UPDATE, CREATE, ALTER, REFERENCES
  ON hom_nay_an_gi.* TO 'hnag_import'@'localhost';
```

Không cần `FLUSH PRIVILEGES` sau `CREATE USER`/`GRANT`. Nếu tài khoản đã tồn tại, kiểm tra tài khoản đó thay vì xóa hoặc tạo lại tùy ý. Đây là tài khoản setup/import, không phải tài khoản runtime của Node.js khi triển khai đăng nhập/admin sau này.

## 3. Cấu hình riêng trên máy

Nếu chưa có `.env`, chép `.env.example` thành `.env`. Nếu đã có, chỉ bổ sung các dòng DB, không ghi đè cấu hình hiện tại.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hom_nay_an_gi
DB_USER=hnag_import
DB_PASSWORD="MAT_KHAU_BAN_VUA_DAT"
```

Đặt mật khẩu trong dấu nháy để ký tự `#` không bị hiểu là comment. `.env` đã được gitignore; không đặt trong `public/`. Không gửi mật khẩu qua chat hoặc tham số dòng lệnh. Với remote MySQL, cấu hình TLS trước khi sử dụng; không đưa dịch vụ database local ra Internet.

## 4. Áp dụng schema và nhập

```powershell
npm run db:setup
```

Kết quả lần đầu: `status: imported`. Lần sau, nếu nguồn giống nhau: `status: already-imported`, không ghi đè nội dung danh mục. Bản chuyển Model sang MySQL bổ sung một lần tài liệu `catalog-order-v1` để giữ thứ tự gốc; không thay tên, nguồn, nhãn hoặc công thức. Sau khi đã tạo schema, có thể dùng `npm run db:import` để chạy phần nhập riêng.

- Kiểm tra toàn bộ dữ liệu trước khi ghi.
- Từ chối database chứa bảng không thuộc dự án.
- Từ chối seed vào dữ liệu đã có khi không có manifest nhập tương ứng.
- Không DROP/TRUNCATE, không tắt khóa ngoại, không `INSERT IGNORE` để che lỗi dữ liệu.
- Dữ liệu seed nhập trong một transaction. Nếu lỗi, rollback toàn bộ dữ liệu seed.
- DDL MySQL có implicit commit: khi tạo schema lỗi có thể còn bảng rỗng. Khắc phục lỗi rồi chạy lại `db:setup`; không khẳng định DDL rollback cùng dữ liệu.
- Khi nguồn thay đổi sau khi đã nhập, script từ chối và yêu cầu migration được rà soát. Không dùng seed để đồng bộ đè dữ liệu quản trị.
- Advisory lock ngăn hai tiến trình seed cùng lúc; chỉ chạy bootstrap khi chưa có tác vụ chỉnh dữ liệu.

`schema.sql` cũng có thể mở bằng Workbench sau `USE hom_nay_an_gi;` cho lần đầu. Với lần chạy lại, dùng `db:setup` vì nó kiểm tra khóa ngoại ảnh bìa trước khi thêm lại. `schema_versions` được bootstrap script ghi sau khi DDL hoàn tất.

## 5. Kiểm tra bằng SQL

```sql
USE hom_nay_an_gi;
SELECT COUNT(*) FROM dishes;                 -- 105
SELECT COUNT(*) FROM restaurants;            -- 105
SELECT COUNT(*) FROM recipes;                -- 14
SELECT COUNT(*) FROM recipe_ingredients;     -- 158
SELECT COUNT(*) FROM recipe_steps;           -- 56
SELECT match_type, COUNT(*) FROM restaurant_dishes GROUP BY match_type;
-- dish: 106, related: 3
SELECT status, COUNT(*) FROM dish_reviews GROUP BY status;
-- reviewed: 2, source-declared: 9, verified: 4
SELECT d.name, r.name, rd.offering
FROM restaurant_dishes rd
JOIN dishes d ON d.id=rd.dish_id
JOIN restaurants r ON r.id=rd.restaurant_id
WHERE rd.dish_id='pho-bo' AND rd.match_type='dish';
SELECT * FROM seed_imports;
```

## 6. Kiểm thử MySQL thật, không đụng MySQL84 hiện có

```powershell
npm run test:db
```

Mặc định tìm `C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe`. Nếu cài chỗ khác, đặt `MYSQLD_PATH` là đường dẫn file thực thi. Test dùng `--no-defaults`, tạo data directory mới trong thư mục TEMP, chọn cổng ngẫu nhiên trên `127.0.0.1` và tắt X Protocol. Tài khoản rỗng mật khẩu chỉ tồn tại ở instance test tạm này, tuyệt đối không áp dụng cho dịch vụ hiện có.

Test kiểm tra DDL trên MySQL 8.4, nhập đủ dữ liệu/Unicode/nguồn, định lượng khoảng và văn bản, thứ tự bước, phân biệt liên kết, nhãn có căn cứ, khóa ngoại, CHECK, rollback lỗi giữa chừng, chạy lặp không đè sửa đổi và từ chối nguồn thay đổi. Kết thúc bằng SHUTDOWN rồi chỉ xóa thư mục TEMP do test tạo. Không đọc `.env`, không biết mật khẩu root và không kết nối cổng 3306.

`npm test` cũng dựng MySQL tạm riêng, nhập seed rồi chạy toàn bộ kiểm thử thường/Model/API; đóng pool sau mỗi test worker. Bài kiểm thử chuyên sâu quy trình import được skip trong suite này và chạy bằng `npm run test:db`. Cả hai lệnh đều không dùng `.env` hoặc database đang phục vụ website.

## Sau đợt này

Model/API đã đọc các cột/bảng quan hệ MySQL; không lấy lại giá trị vận hành từ source_record cũ. Dữ liệu provenance/greeting/sourceNumber chưa có cột riêng được lấy từ metadata JSON trong MySQL. Danh mục 105 bản ghi vẫn lọc/phân trang trong Model để giữ hành vi tìm không dấu hiện có; khi danh mục lớn hơn sẽ chuyển tìm kiếm/phân trang sang SQL.

Đã có xác thực/phân quyền và API thêm/sửa quán, món ăn lưu thật. Liên kết, công thức và căn cứ nhãn cũng đã có API lưu thật. Không tự nhập yêu thích hoặc bản nháp của trình duyệt.

## Tài khoản chỉ đọc danh mục

Sau khi setup xong, quản trị viên có thể chạy bằng root trong Workbench:

```sql
CREATE USER 'hnag_app'@'localhost' IDENTIFIED BY 'MAT_KHAU_RIENG_CHO_RUNTIME';
GRANT SELECT ON hom_nay_an_gi.* TO 'hnag_app'@'localhost';
```

Sau đó đổi DB_USER/DB_PASSWORD trong `.env` sang tài khoản này, khởi động lại Node. Khi cần setup/migration, dùng thông tin tài khoản nhập có quyền DDL qua biến môi trường riêng. Không cấp quyền root cho ứng dụng. SELECT chỉ đủ để đọc danh mục. Đăng nhập/đăng xuất cần thêm quyền trên bảng auth theo docs/AUTH.md; script seed cần các quyền import đã hướng dẫn ở trên.

## Migration đăng nhập quản trị

`npm run db:setup` hiện áp dụng thêm `database/migrations/002-admin-auth.sql`: giữ bảng users và dữ liệu cũ, bổ sung các trường Better Auth, cho cột password_hash cũ nhận NULL, thêm auth_accounts/auth_sessions/auth_verifications/auth_rate_limits. Tổng 22 bảng. Không có tài khoản/mật khẩu được seed sẵn. Xem [docs/AUTH.md](../docs/AUTH.md) để tạo admin và cấp quyền runtime; tài khoản SELECT-only không đủ cho đăng nhập/đăng xuất.

## Migration thêm/sửa quán

`003-restaurant-writes` thêm admin_details, revision, updated_at vào restaurants và bảng restaurant_audit. Tổng 23 bảng. Không thay các liên kết cũ hoặc nguồn gốc. Xem [hướng dẫn quản trị quán](../docs/RESTAURANT-ADMIN.md) để cấp quyền cần thiết và chạy API ghi; xem thêm các mục quản trị trong docs/ADMIN-CATALOG.md.

`004-dish-writes` bổ sung revision, admin_image_url, updated_at vào dishes và bảng dish_audit, tổng 24 bảng. Xem [hướng dẫn quản trị món](../docs/DISH-ADMIN.md). Áp dụng trên từng database bằng `npm run db:setup`; sửa món giữ nguyên liên kết quán, công thức và căn cứ nhãn.

`005-admin-catalog` thêm admin_catalog_versions và admin_catalog_audit, tổng 26 bảng. Xem [hướng dẫn quản trị danh mục](../docs/ADMIN-CATALOG.md) để cấp quyền, nhập công thức có định lượng, công bố/thu hồi liên kết và đối chiếu nhãn.

`006-catalog-visibility` thêm is_visible vào dishes/restaurants, mặc định TRUE cho dữ liệu cũ, không thêm bảng và không xóa liên kết. Xem [ẩn/hiện món và quán](../docs/VISIBILITY.md). Chạy migration trên từng database riêng, không tự đổi MySQL local dự phòng khi cập nhật Aiven.
