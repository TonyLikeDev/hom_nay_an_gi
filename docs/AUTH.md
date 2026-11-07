# Đăng nhập và phân quyền quản trị

Đã dùng Better Auth với MySQL. Giao diện đăng nhập/admin được giữ bố cục; tài khoản mẫu không còn sử dụng. Đăng nhập bằng tài khoản website, không dùng root/hnag_import của MySQL.

## Thiết lập trên máy thành viên

1. Lấy code, chạy `npm ci` và cấu hình MySQL theo `database/README.md`.
2. Chạy `npm run db:setup`. Migration `002-admin-auth` bổ sung bảng auth và cột user; không xóa danh mục/dữ liệu cũ. DDL có implicit commit, script kiểm tra các cột đã có để có thể chạy lại sau lỗi một phần.
3. Bổ sung vào `.env`:

```dotenv
BETTER_AUTH_URL=http://127.0.0.1:3000
BETTER_AUTH_SECRET="SECRET_NGAU_NHIEN_TOI_THIEU_32_KY_TU"
```

Sinh secret bằng `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"` rồi dán riêng vào `.env`; không commit hoặc chia sẻ. Mỗi môi trường có secret riêng, giữ cố định giữa các lần khởi động. Đổi secret làm cookie cũ mất hiệu lực. URL phải khớp origin trình duyệt (127.0.0.1 và localhost là hai origin khác nhau). Production bắt buộc HTTPS.

4. Tạo admin đầu tiên:

```powershell
npm run admin:create -- email-cua-ban@example.com
```

Nhập mật khẩu hai lần trong terminal; ký tự được ẩn, tối thiểu 12 và tối đa 128 ký tự. Trên Windows có thể dùng hộp nhập riêng:

```powershell
npm run admin:create -- email-cua-ban@example.com --desktop
```

Không đưa mật khẩu vào tham số lệnh, file SQL, chat hoặc repo. Email phải thuộc người được phép quản trị. Script chỉ dùng nội bộ trên máy có quyền database, không có endpoint tạo admin công khai. Nếu email đã tồn tại, script từ chối, không tự đổi mật khẩu/nâng quyền. Không gửi email xác minh hoặc email mật khẩu; người quản trị tạo tài khoản trực tiếp.

5. `npm start`, mở `http://127.0.0.1:3000/admin-login.html`. Đăng nhập, thử tải lại trang và Đăng xuất.

## Quyền và lưu trữ

- `users`: vai trò `user`/`admin`, email và tên. Cột password_hash cũ được giữ nhưng cho phép NULL; Better Auth lưu hash thông tin đăng nhập trong `auth_accounts.password`.
- `auth_accounts`: thông tin đăng nhập và mật khẩu băm bằng thuật toán do Better Auth cung cấp.
- `auth_sessions`: phiên đăng nhập bền vững trong MySQL; cookie HttpOnly, SameSite=Lax, Secure trên HTTPS. Không lưu token/mật khẩu/quyền vào localStorage.
- `auth_verifications`: cấu trúc của thư viện, chưa có gửi mail/quên mật khẩu.
- `auth_rate_limits`: giới hạn thử đăng nhập (5 lần/phút/IP/đường dẫn), lưu MySQL. Node dùng IP socket thay vì tin header do trình duyệt tự gửi. Khi triển khai sau reverse proxy cần cấu hình nguồn IP tin cậy phù hợp, không tùy ý tin X-Forwarded-For.
- Role được đọc lại từ MySQL ở mỗi request quản trị; đổi role sang user sẽ mất quyền admin ở request tiếp theo. Cookie cache tắt.
- Trang admin được chặn ở server, kể cả đường dẫn có ký tự URL-encode; API `/api/admin/*` kiểm tra đăng nhập và quyền trước khi xử lý.
- POST đăng nhập/đăng xuất phải có Origin đúng website, định dạng JSON và body tối đa 8 KiB; endpoint khác của Better Auth không được mở công khai.
- Bản nháp admin vẫn nằm trên thiết bị, được tách theo ID tài khoản (`hnag:admin-drafts:v1:user:ID`). Bản nháp cũ không rõ chủ sở hữu được giữ ở khóa cũ nhưng không tự nhập vào tài khoản mới.

## API hiện có

- POST `/api/auth/sign-in/email`: email/password, tạo cookie; phản hồi không chứa token.
- POST `/api/auth/sign-out`: thu hồi phiên hiện tại và xóa cookie.
- GET `/api/auth/me`: user công khai của phiên hiện tại; không có phiên trả 401.
- GET `/api/admin/me`: admin hiện tại; chưa đăng nhập 401, thiếu quyền 403.
- GET `/api/admin/users?page=1`: tối đa 20 tài khoản/trang, chỉ id/email/name/role/createdAt, không có hash/token.

Chưa có đăng ký công khai, gửi mail, quên mật khẩu, OAuth, API sửa vai trò, hoặc API ghi món/công thức. Admin đã thêm/sửa quán vào MySQL theo RESTAURANT-ADMIN.md; các mục khác vẫn lưu bản nháp cục bộ.

## Quyền database cho ứng dụng

Tài khoản chỉ SELECT của giai đoạn trước không đủ cho đăng nhập. Runtime cần:

```sql
GRANT SELECT ON hom_nay_an_gi.* TO 'hnag_app'@'localhost';
GRANT INSERT, UPDATE, DELETE ON hom_nay_an_gi.auth_sessions TO 'hnag_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON hom_nay_an_gi.auth_rate_limits TO 'hnag_app'@'localhost';
```

Tài khoản thiết lập admin cần INSERT vào users/auth_accounts cùng quyền SELECT; tài khoản setup/migration cần DDL theo hướng dẫn database. Không dùng root cho runtime. Tài khoản nhập hiện có có thể thiếu DELETE: cấp quyền DELETE chỉ cho auth_sessions và auth_rate_limits để đăng xuất/thu hồi phiên hoạt động. Nhóm tự quản lý quyền trong Workbench bằng root; script không tự cấp quyền MySQL.

Có thể dọn phiên đã hết hạn và rate-limit cũ bằng tác vụ bảo trì có quyền phù hợp. Chưa triển khai tác vụ dọn tự động.

## Kiểm thử

`npm test` dựng MySQL tạm riêng và kiểm tra: băm mật khẩu, đăng nhập sai/đúng, chặn signup công khai, không cho gửi role để tự nâng quyền, cookie HttpOnly/SameSite, trang/API admin, mất quyền ngay khi đổi role, logout, phiên hết hạn, CSRF và rate-limit. Test UI dùng tài khoản riêng trong database tạm, không dùng mật khẩu admin thật.
