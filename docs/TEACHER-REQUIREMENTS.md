# Đối chiếu yêu cầu giảng viên

Rà soát ngày 07/11/2026. Phạm vi đợt này: kiểm tra các branch, hợp nhất phần hoạt động tốt vào `main` và ghi lại các yêu cầu còn thiếu. Chưa triển khai các chức năng mới bên dưới.

## Phần được hợp nhất

Branch `hom-nay-an-gi-phuc-hung` tại commit `54825cb` là bản cập nhật mới nhất sau khi fetch remote. Bản này cung cấp danh mục dùng chung cho quay ngẫu nhiên và tìm kiếm, MySQL, quản trị có đăng nhập, công thức, danh sách quán theo món và yêu thích trên trình duyệt.

`update_m2` và `update_m3` trùng phiên bản `main` cũ (`dd3a584`). `update_m1` thêm quẻ trưa, chưa phục vụ trực tiếp các yêu cầu dưới đây nên không đưa vào đợt hợp nhất. Giữ các cải tiến trang chủ của `main`, cách xử lý giảm chuyển động và cập nhật URL theo món sau khi quay lại; giữ các bộ lọc mới trong URL.

## Yêu cầu và khoảng trống

| Yêu cầu | Hiện trạng | Cần làm tiếp |
| --- | --- | --- |
| Quán cung cấp dữ liệu để website random món quảng cáo | Quản trị viên có thể nhập món/quán, liên kết món–quán và ẩn/hiện; món đã công khai được đưa vào danh mục quay chung. | Chưa có luồng quán tự gửi dữ liệu, duyệt hợp tác, trạng thái chiến dịch hay nhãn quảng cáo. Xây quy trình tiếp nhận và xác minh trước khi đưa dữ liệu vào vòng quay; ghi rõ nội dung tài trợ. |
| Hiển thị quán ở phía dưới món được chọn | Trang kết quả tải tối đa 3 quán; có liên kết xem toàn bộ, trạng thái trống, thử lại và phân biệt món khớp với món cùng nhóm. | Seed có 78/105 món có liên kết quán trực tiếp. Bổ sung dữ liệu có căn cứ cho các món còn thiếu; không gán quán bán đúng món từ suy đoán. |
| Món được đề xuất có công thức hoặc nơi bán | Có 14 công thức và 78 món có quán liên kết trực tiếp; tổng cộng 90/105 món có ít nhất một trong hai. Bộ lọc “Có công thức” và “Có quán” hiện là tùy chọn, chọn cả hai sẽ yêu cầu cả hai điều kiện. | 15 món chưa có công thức lẫn liên kết quán trực tiếp. Bổ sung dữ liệu hoặc áp dụng điều kiện “có công thức HOẶC quán đã xác minh” cho vòng quay theo yêu cầu. Công thức tham khảo không được nhận là công thức riêng của quán. |
| Dữ liệu thật của các quán, quán hợp tác phải cung cấp dữ liệu | 105 mục địa điểm nhập từ workbook, có lưu nguồn; tất cả đang mang trạng thái `spreadsheet`. Đây không phải 105 chi nhánh đã được xác minh. | Nhận thực đơn từ đại diện quán, xác minh chi nhánh/người cung cấp, giá từng món, tình trạng bán, ảnh được phép dùng, nguồn và ngày kiểm tra. Khử trùng lặp, giữ lịch sử duyệt và cơ chế cập nhật. Không thể cam kết dữ liệu đầy đủ cho mọi quán khi chưa có dữ liệu từ họ. |
| Trang để quán đăng ký hợp tác | Chỉ có trang đăng nhập và trang quản trị nội bộ. Trạng thái `draft-partner` trong quản trị chưa phải quy trình hợp tác. | Tạo trang đăng ký công khai, API lưu hồ sơ riêng và màn hình quản trị duyệt/từ chối. Hồ sơ chưa duyệt không tự xuất hiện công khai; thông tin liên hệ được giữ riêng. |
| Hợp tác Grab/ShopeeFood để vận chuyển | Có nút mở nền tảng bên ngoài, chọn khu vực và sao chép tên món; không có API đặt hàng hay vận chuyển. Link nền tảng theo từng quán có thể nhập ở quản trị nhưng hiện chưa được xuất ra API công khai/giao diện quán. | Theo lựa chọn hiện tại, tiếp tục dùng link đặt món bên ngoài và bổ sung hiển thị link quán đã xác minh. Chỉ làm tích hợp vận chuyển thực khi có thỏa thuận, tài liệu và quyền truy cập chính thức. |

## Dữ liệu cần chuẩn bị cho hồ sơ hợp tác

- Tên quán/chi nhánh, địa chỉ chính xác, người đại diện, email/số điện thoại liên hệ và căn cứ xác minh.
- Danh sách món: tên, mô tả, giá bằng VND, bữa phục vụ, tình trạng còn bán và thời điểm cập nhật.
- Ảnh do quán cung cấp kèm quyền sử dụng; công thức chỉ khi quán muốn chia sẻ và cho phép công khai.
- Link đúng chi nhánh trên GrabFood/ShopeeFood nếu có; không tự gán từ trang chủ hoặc kết quả tìm kiếm.
- Đồng ý hợp tác, sử dụng dữ liệu/ảnh và cách liên hệ để cập nhật hoặc ngừng hiển thị.

Ưu tiên tiếp theo: trang đăng ký và hồ sơ chờ duyệt → xác minh dữ liệu món/quán → đưa dữ liệu được duyệt vào vòng quay và hiển thị quảng cáo rõ ràng → link đặt món của từng quán. Người dùng xác nhận hiện chưa có thực đơn do quán cung cấp hoặc quyền truy cập đối tác vận chuyển.

## Giới hạn vận hành

Phiên bản mới cần Node.js 24 và MySQL hoạt động; cách chạy cũ bằng `python -m http.server` không đủ. Database và secret phải cấu hình riêng theo README. Không đưa database đang phục vụ website vào kiểm thử hoặc tự động ghi đè từ seed. Ảnh tải từ website quán trong prototype vẫn cần quyền sử dụng trước khi phát hành công khai; xem [nguồn dữ liệu](RESTAURANT-DATA.md).

## Kiểm tra trong đợt hợp nhất

- `npm ci --ignore-scripts`: cài đúng lockfile, báo cáo 0 lỗ hổng từ npm tại thời điểm kiểm tra.
- `MYSQLD_PATH=/usr/local/mysql/bin/mysqld npm test`: 31 bài đạt, 0 lỗi, 1 bài integration riêng được bỏ qua theo cấu hình suite. Dùng instance/database tạm, không dùng database của website.
- `npm run db:check`, `npm run build:vercel` và kiểm tra cú pháp 69 file JavaScript của branch nguồn đều đạt. Hai regression test mới kiểm tra URL sau khi quay lại và vị trí cuộn ẩm thực với cả hai chế độ chuyển động.
- `npm run test:db` chưa đạt trên máy này: bài test dừng ở kiểm tra phiên bản vì yêu cầu MySQL `8.4.x`, trong khi máy cài `26.7.0`. Cần chạy lại bài integration này trên MySQL 8.4 trước khi kết luận tương thích với môi trường mục tiêu; không nới điều kiện kiểm thử để bỏ qua lỗi.
- Chưa kiểm tra giao diện trực tiếp trên desktop/mobile: browser automation không sẵn sàng và quyền dùng ứng dụng trình duyệt không được cấp.
- Ba cảnh báo thiết kế được xác nhận là báo sai từ mã nguồn: màu sáng bị ghép với nền tối dù có override cho dark theme; dialog có padding ở `.slot__body`; marker ảnh chỉ nằm trong fixture VM. Các ngoại lệ được giới hạn theo rule/file và ghi lý do trong `.impeccable/config.json`. Không có cảnh báo nào bị bỏ qua vì chưa rõ nguyên nhân.
