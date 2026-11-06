# Hôm nay ăn gì? 🍜

Website gợi ý món ăn và tìm địa điểm ăn uống tại Đà Nẵng. Bạn có thể quay ngẫu nhiên để chọn món, lọc theo sở thích, xem công thức nấu ăn và lưu các món hoặc quán yêu thích.

Dự án sử dụng **HTML, CSS, JavaScript thuần**, backend **Node.js** theo mô hình MVC, **MySQL** để lưu dữ liệu và **Better Auth** để xác thực quản trị viên.

## Tính năng

- **Gợi ý ngẫu nhiên:** chọn món hoặc nền ẩm thực, có tùy chọn chế độ ăn, có công thức và có quán liên kết. Điều kiện lọc được giữ trong URL khi quay lại.
- **Khám phá món ăn:** duyệt danh mục, lọc theo nền ẩm thực và bữa ăn, xem thông tin món và quán liên quan.
- **Tìm quán ăn:** tìm kiếm, lọc, phân trang và xem chi tiết địa điểm tại Đà Nẵng.
- **Công thức nấu ăn:** xem nguyên liệu, điều chỉnh khẩu phần từ 1–12 người và đánh dấu các bước đã làm.
- **Yêu thích:** lưu món và quán trên trình duyệt, đồng bộ trạng thái giữa các tab cùng website.
- **Quản trị:** đăng nhập, thêm/sửa món và quán, quản lý liên kết món–quán, công thức, căn cứ nhãn và trạng thái ẩn/hiện; dữ liệu được lưu vào MySQL.

Bộ dữ liệu khởi tạo gồm **105 món, 7 nhóm ẩm thực, 105 địa điểm và 14 công thức**. Nội dung thực tế có thể thay đổi sau khi quản trị viên cập nhật database.

## Yêu cầu

- **Node.js 24.x** và npm.
- **MySQL 8.4 LTS** đang hoạt động, trên máy cá nhân hoặc dịch vụ MySQL từ xa.
- Tài khoản database có quyền phù hợp cho việc khởi tạo và chạy ứng dụng.

## Cài đặt và chạy trên máy

### 1. Lấy mã nguồn

```powershell
git clone --branch hom-nay-an-gi-phuc-hung https://github.com/TonyLikeDev/hom_nay_an_gi.git
cd hom_nay_an_gi
npm ci
```

Nếu đã có repo trên máy, lưu các thay đổi cá nhân trước khi chuyển branch:

```powershell
git fetch origin
git switch hom-nay-an-gi-phuc-hung
npm ci
```

### 2. Chuẩn bị database và cấu hình

Làm theo [hướng dẫn MySQL](database/README.md) để tạo database và tài khoản riêng. Nếu chưa có `.env`, sao chép file mẫu:

```powershell
Copy-Item .env.example .env
```

Điền thông tin kết nối của bạn trong `.env`:

```dotenv
HOST=127.0.0.1
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=hom_nay_an_gi
DB_USER=hnag_import
DB_PASSWORD="MAT_KHAU_DATABASE_CUA_BAN"
BETTER_AUTH_URL=http://127.0.0.1:3000
BETTER_AUTH_SECRET="SECRET_NGAU_NHIEN_TOI_THIEU_32_KY_TU"
```

Thay các giá trị minh họa bằng cấu hình riêng. Có thể tạo secret bằng lệnh sau rồi dán kết quả vào `.env`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Giữ secret cố định cho từng môi trường. Không commit `.env`, mật khẩu hoặc secret; file `.env` đã được bỏ qua trong `.gitignore`. Tài khoản khởi tạo database và tài khoản chạy ứng dụng cần được cấp quyền theo [hướng dẫn database](database/README.md) và các tài liệu quản trị bên dưới.

### 3. Khởi tạo dữ liệu

```powershell
npm run db:check
npm run db:setup
```

`db:check` kiểm tra dữ liệu nguồn, không kết nối database. `db:setup` áp dụng schema, các migration và nhập dữ liệu ban đầu. Khi dữ liệu đã được nhập, script không ghi đè các chỉnh sửa quản trị; seed không phải công cụ đồng bộ dữ liệu giữa các máy.

### 4. Chạy website

```powershell
npm start
```

Mở **http://127.0.0.1:3000**. Khi phát triển, dùng `npm run dev` để server tự khởi động lại khi sửa file.

MySQL cần hoạt động trong lúc sử dụng website. Dữ liệu danh mục và công thức được backend đọc từ MySQL; sửa JSON hoặc bản JavaScript seed không tự cập nhật database. Khi database lỗi, API trả HTTP 503.

## Đăng nhập quản trị

Sau khi thiết lập database và secret, tạo quản trị viên đầu tiên:

```powershell
npm run admin:create -- email-cua-ban@example.com
```

Lệnh yêu cầu nhập mật khẩu trong terminal. Trên Windows có thể mở hộp nhập riêng:

```powershell
npm run admin:create -- email-cua-ban@example.com --desktop
```

Sau đó chạy website và mở **http://127.0.0.1:3000/admin-login.html**. Dự án không có tài khoản hoặc mật khẩu quản trị mẫu.

Trang quản trị và API `/api/admin/*` kiểm tra phiên đăng nhập, vai trò admin ở server. Các chức năng ghi cần quyền database tương ứng:

- [Xác thực, phiên đăng nhập và tạo admin](docs/AUTH.md)
- [Thêm/sửa quán ăn](docs/RESTAURANT-ADMIN.md)
- [Thêm/sửa món ăn](docs/DISH-ADMIN.md)
- [Quản lý liên kết, công thức và căn cứ nhãn](docs/ADMIN-CATALOG.md)
- [Ẩn/hiện món và quán](docs/VISIBILITY.md)

## Các lệnh thường dùng

- `npm start`: chạy server.
- `npm run dev`: chạy server với chế độ theo dõi thay đổi.
- `npm run db:check`: kiểm tra bộ dữ liệu nguồn.
- `npm run db:setup`: áp dụng schema/migration và nhập dữ liệu ban đầu.
- `npm run db:import`: nhập dữ liệu vào schema đã có.
- `npm run admin:create -- <email>`: tạo tài khoản quản trị.
- `npm test`: chạy bộ kiểm thử với một instance MySQL tạm riêng.
- `npm run test:db`: kiểm thử chuyên sâu schema và quy trình nhập MySQL.
- `npm run build:vercel`: chuẩn bị output triển khai Vercel.

Hai lệnh kiểm thử MySQL không sử dụng `.env` hoặc database đang phục vụ website. Công cụ mặc định tìm `mysqld.exe` tại `C:/Program Files/MySQL/MySQL Server 8.4/bin/`; nếu cài ở nơi khác, đặt biến `MYSQLD_PATH` trỏ tới file thực thi. Xem thêm [hướng dẫn kiểm thử database](database/README.md).

## Cấu trúc dự án

```text
hom_nay_an_gi/
├── public/             # HTML, CSS, JavaScript và hình ảnh giao diện
├── server/
│   ├── app.js          # HTTP server và xử lý request
│   ├── routes/         # Định tuyến API
│   ├── controllers/    # Tiếp nhận request, trả phản hồi
│   ├── models/         # Truy vấn và ánh xạ dữ liệu MySQL
│   ├── config/         # Kết nối database và xác thực
│   ├── middleware/     # Kiểm tra đăng nhập và quyền truy cập
│   ├── services/       # Các dịch vụ nội bộ
│   ├── validators/     # Kiểm tra dữ liệu đầu vào
│   └── utils/          # Tiện ích backend
├── api/                # Điểm vào Node Function trên Vercel
├── database/           # Schema, migration và hướng dẫn MySQL
├── data/               # Dữ liệu nguồn dùng để khởi tạo
├── scripts/            # Công cụ nhập dữ liệu, quản trị và build
├── tests/              # Kiểm thử dữ liệu, Model và API
├── docs/               # Tài liệu kỹ thuật theo chức năng
├── .env.example        # Mẫu cấu hình môi trường
├── package.json        # Dependency và các lệnh npm
└── vercel.json         # Cấu hình triển khai Vercel
```

Giao diện được phục vụ từ `public/`, không dùng EJS. Khi chạy qua backend, `/js/data.js` và `/js/recipes.js` được tạo từ MySQL để cung cấp dữ liệu cho frontend.

## API chính

Các endpoint công khai hỗ trợ `GET`:

```text
/api/dishes
/api/dishes?cuisine=viet&meal=sang
/api/dishes/pho-bo
/api/dishes/pho-bo/restaurants
/api/restaurants
/api/restaurants/dn-013
```

Danh sách quán hỗ trợ các tham số `q`, `category`, `meal`, `priceTier`, `page` và `pageSize`. Các API quản trị nằm dưới `/api/admin/*` và yêu cầu quyền admin.

## Dữ liệu và phạm vi hiện tại

- **MySQL là nguồn dữ liệu khi chạy ứng dụng.** Git lưu code, schema và seed; dữ liệu đã chỉnh trong database không tự đi theo thao tác clone/push.
- **Yêu thích lưu trong localStorage.** Chưa có tài khoản người dùng công khai hoặc đồng bộ yêu thích giữa các thiết bị/domain.
- **Công thức và nhãn có phạm vi riêng.** Công thức tham khảo không đại diện cho công thức của quán; nhãn dinh dưỡng hoặc ăn chay không tự áp dụng cho suất ăn tại quán.
- **Liên kết món–quán có mức độ khác nhau.** Liên kết `related` không xác nhận quán bán đúng món. Xem [nguồn dữ liệu địa điểm](docs/RESTAURANT-DATA.md) và [liên kết giao đồ ăn](docs/DELIVERY-LINKS.md).
- **Chưa tích hợp đặt hàng, thanh toán hoặc đăng ký tài khoản công khai.**

## Triển khai Vercel

Repository có cấu hình Node Function dùng chung backend MVC. Thực hiện theo [hướng dẫn triển khai Vercel](docs/VERCEL.md) và chọn đúng branch muốn triển khai, chẳng hạn `hom-nay-an-gi-phuc-hung`.

Cấu hình biến môi trường database, TLS và Better Auth riêng trên Vercel. Database phải truy cập được từ môi trường triển khai; database trên máy cá nhân không tự được đưa lên cùng code. Bước build không chạy seed hoặc migration; việc cập nhật schema cần thực hiện riêng.

## Tài liệu phát triển

Xem [hướng dẫn phát triển](docs/DEVELOPMENT.md) để tiếp tục mở rộng dự án. Khi thay đổi schema hoặc quyền database, cập nhật tài liệu tương ứng và kiểm tra trên database riêng trước khi áp dụng vào môi trường dùng chung.
