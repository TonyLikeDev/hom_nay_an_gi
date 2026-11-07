# Kiểm thử

- `npm test`: tạo instance MySQL 8.4 tạm riêng, seed rồi chạy test Node. Không đọc .env, không dùng cổng/database của MySQL84. Bao gồm kiểm thử hợp đồng API, nguồn dữ liệu live, tìm kiếm/phân trang, món–quán, nhãn, công thức và lỗi database 503.
- `npm run test:db`: kiểm thử chuyên sâu import/rollback/khóa ngoại/chạy lặp, dùng instance tạm khác.
- Cần MySQL 8.4 đã cài; nếu khác đường dẫn mặc định trên Windows thì đặt MYSQLD_PATH.
- Các test tự sửa dữ liệu dùng database riêng trong instance tạm, không ảnh hưởng dữ liệu baseline của test khác hoặc dữ liệu người dùng.
- Các bài test thuần dữ liệu có thể chạy riêng bằng `node --test tests/mysql-seed.test.js tests/recipes.test.js`; các test Model cần chạy qua npm test.
