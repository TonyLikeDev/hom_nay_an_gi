# Hôm nay ăn gì?

Ứng dụng **React + Vite**, dữ liệu và đăng nhập bằng **Supabase**, triển khai frontend trên **Vercel**. Giữ thiết kế, danh mục và ID món/quán của phiên bản trước; không cần Node API, MySQL hoặc Better Auth để chạy ứng dụng mới.

## Tính năng

- Chọn món ngẫu nhiên theo bữa, ẩm thực, chế độ ăn, có công thức hoặc có quán; giữ tùy chọn trong URL.
- Tìm món/quán, xem chi tiết quán và các món liên kết từ dữ liệu hiện tại.
- 105 công thức, đủ toàn bộ món/đồ uống trong danh mục ban đầu, có điều chỉnh khẩu phần, đánh dấu nguyên liệu và các bước.
- Quay món có hiệu ứng đảo tên chậm dần rồi hiện kết quả; hỗ trợ giảm chuyển động và hủy khi rời trang.
- Yêu thích lưu trên thiết bị, giữ nguyên khóa và ID của bản cũ.
- **Chủ quán:** đăng ký email, xác nhận email, đăng nhập, quên/đổi mật khẩu, thêm nhiều quán, gửi thực đơn và theo dõi duyệt.
- **Quản trị:** duyệt/từ chối hồ sơ, sửa/ẩn món, quán, liên kết, công thức và căn cứ nhãn; xem tài khoản theo trang.
- Link GrabFood/ShopeeFood đúng chi nhánh xuất hiện trên trang quán khi có; chưa tích hợp đặt hàng, thanh toán hay vận chuyển.

Luồng hợp tác: **tạo tài khoản → xác nhận email → gửi quán và thực đơn → quản trị viên đối chiếu → công bố**. Khi chủ quán sửa hồ sơ đã duyệt, phiên bản công khai trước đó được giữ đến khi bản mới được duyệt. Liên hệ riêng và ghi chú duyệt không được xuất ra danh mục công khai.

## Chạy thử ngay

Cần Node.js **22.12+** (Node 24 phù hợp).

```sh
npm ci
npm run dev
```

Mở địa chỉ Vite in ra, thường là **http://127.0.0.1:5173**. Khi chưa cấu hình Supabase, chế độ phát triển chỉ hiển thị danh mục tham khảo; đăng nhập và ghi dữ liệu được khóa rõ ràng. Không giả lập thành công việc gửi hồ sơ.

```sh
npm test
npm run build:demo
npm run preview
```

`build:demo` tạo bản xem thử chỉ đọc. Build production bình thường sẽ từ chối nếu thiếu cấu hình hoặc phát hiện secret/service-role key trong biến frontend.

## Kết nối Supabase

1. Tạo **project Supabase mới**, tách khỏi database cũ. Dùng SQL Editor chạy lần lượt:
   - [Migration và quyền truy cập](supabase/migrations/202611070001_catalog.sql).
   - [Seed danh mục](supabase/seed.sql).
2. Sao chép `.env.example` thành `.env.local` và điền **Project URL** cùng **publishable key**:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
```

Chỉ hai giá trị dùng được trên trình duyệt này được đưa vào frontend. **Không dùng secret key, service-role key hoặc mật khẩu database trong biến `VITE_`.** Khởi động lại Vite sau khi đổi cấu hình.

3. Trong Supabase **Authentication → Providers → Email**, bật đăng ký email, xác nhận email và mật khẩu tối thiểu 12 ký tự. Cấu hình SMTP riêng khi mở đăng ký công khai; dịch vụ email mặc định chỉ phù hợp thử nghiệm và có giới hạn.
4. Trong **Authentication → URL Configuration**:
   - Site URL: origin production trên Vercel.
   - Redirect URLs: `http://127.0.0.1:5173/partner`, `http://127.0.0.1:5173/reset-password`, cùng hai đường dẫn tương ứng trên domain production.
   - Nếu dùng localhost hoặc preview domain, thêm đúng các URL cần thử; không mở wildcard trên domain không thuộc quyền kiểm soát.
5. Tạo và xác nhận tài khoản tại `/register`. Chủ quán có thể dùng ngay `/partner`; họ không có quyền admin.
6. Để cấp admin, người quản lý project chạy SQL sau trong Dashboard, thay email bằng tài khoản đã xác nhận của mình:

```sql
insert into private.admin_users(user_id)
select id from auth.users where lower(email) = lower('EMAIL_CUA_BAN');
```

Đăng xuất/đăng nhập lại rồi mở `/admin`. Không có mật khẩu mẫu hoặc endpoint tự nâng quyền. Role không được lấy từ metadata mà người dùng có thể sửa.

## Deploy lên Vercel

- Import repo, chọn branch `simplize-project` để xem bản migration trước khi hợp nhất.
- Framework: **Vite**. Build command: `npm run build`. Output: `dist`.
- Thêm `VITE_SUPABASE_URL` và `VITE_SUPABASE_PUBLISHABLE_KEY` cho đúng môi trường. Vercel build frontend với các giá trị này; đổi chúng cần redeploy.
- `vercel.json` đã có rewrite để các URL `/partner`, `/restaurant`, `/admin` tải lại trực tiếp được.
- Cập nhật Site URL/Redirect URLs trong Supabase theo domain được cấp, rồi kiểm tra email xác nhận và đặt lại mật khẩu.

Vercel chỉ host frontend; dữ liệu, đăng nhập và kiểm tra quyền nằm ở Supabase. Deploy không tự chạy migration hoặc seed. Migration chỉ chạy trên project mới sau khi đã kiểm tra, không thay thế hay xóa MySQL cũ.

## Dữ liệu và kiểm thử

Nguồn migration là catalog đã commit: **105 món, 105 mục địa điểm và 109 liên kết**. Giữ nguyên 14 công thức cũ, bổ sung 91 công thức biên soạn tham khảo tại nhà, tổng cộng **105 công thức**. Người dùng xác nhận dùng catalog Git; chỉnh sửa nằm riêng trong MySQL không được tự nhập. Tài khoản Better Auth cũ không tự chuyển sang Supabase Auth; tạo lại tài khoản bằng email trong ứng dụng mới.

`npm run db:seed` tạo lại `supabase/seed.sql` từ `data/*.json`. Seed dùng `ON CONFLICT DO NOTHING`: chạy lại không ghi đè chỉnh sửa quản trị. Thay JSON không tự cập nhật dữ liệu đang chạy. Xem [nguồn và phạm vi dữ liệu](docs/DATA.md) và [yêu cầu giảng viên](docs/TEACHER-REQUIREMENTS.md).

**Project Supabase đã chạy migration:** để thêm các công thức mới, chạy lại [seed](supabase/seed.sql) trong SQL Editor, không chạy lại migration tạo schema. Seed chỉ thêm hàng còn thiếu, giữ công thức đã chỉnh sửa hoặc đã ẩn. Món đối tác tạo thêm sau này vẫn cần được biên tập công thức riêng trong admin; không tự gán công thức của món khác.

`npm test` dùng Node và PostgreSQL nhúng PGlite, không kết nối database của website. Bao gồm chính sách quyền theo người dùng, hồ sơ chưa duyệt, người lạ sửa hồ sơ, duyệt/công bố, xung đột, retry, ẩn/hiện và validation. Kiểm thử React render các route và escaping dữ liệu. Email, phiên Supabase thật và deployment cần kiểm tra thêm sau khi kết nối tài khoản dịch vụ.

## Cấu trúc

```text
src/
  pages/          Mỗi trang công khai một file; auth, chủ quán và quản trị
  components/     Thành phần dùng chung; admin/ và partner/ chứa form tương ứng
  lib/            Supabase client, lọc/chọn món, constants
  providers.jsx   Catalog, phiên đăng nhập và yêu thích
  styles.css      Thiết kế hiện có và các form mới
supabase/
  migrations/     Schema, chính sách quyền và các thao tác ghi an toàn
  seed.sql        Import dữ liệu ban đầu, không ghi đè
public/images/    Ảnh và tài nguyên hiện có
scripts/          Tạo seed và kiểm tra biến frontend
tests/           Logic, SQL và React render
```

Các URL `.html` cũ được chuyển tiếp sang route React, giữ query string. Ảnh và dữ liệu tham khảo không đại diện cho quán đã xác minh; tài khoản dịch vụ và hồ sơ thực tế chưa được tạo chỉ bằng việc clone repo.
