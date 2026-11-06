# Cấu hình server

`database.js` tạo pool mysql2 từ DB_HOST, DB_PORT, DB_NAME, DB_USER và DB_PASSWORD. Pool được tạo khi cần, giới hạn 5 kết nối; closeDatabase đóng kết nối khi shutdown hoặc kết thúc test.

`.env` nằm ở gốc, ngoài public và được gitignore. Không đặt mật khẩu trong code hoặc log. Khi triển khai remote, có thể cung cấp chứng chỉ PEM qua DB_SSL_CA để xác thực TLS.

Đọc danh mục cần SELECT; đăng nhập cần INSERT/UPDATE/DELETE trên auth_sessions và auth_rate_limits theo docs/AUTH.md. Tài khoản setup/import cần quyền tạo và sửa cấu trúc theo database/README.md. Không tự đổi hay tạo tài khoản khi khởi động website.

`auth.js` cấu hình Better Auth, cookie/session, origin và giới hạn thử mật khẩu. Secret riêng trong BETTER_AUTH_SECRET; không tự seed admin khi khởi động.
