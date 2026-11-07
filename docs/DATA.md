# Nguồn dữ liệu và phạm vi công bố

Bản migration giữ nguyên 105 món, 105 mục địa điểm, 109 liên kết và 14 công thức từ branch đã được hợp nhất vào main (`ed80a92`). Đây là dữ liệu đã commit, không phải bản sao của những chỉnh sửa trên database MySQL bên ngoài.

## Địa điểm ban đầu

105 mục nhập từ workbook `data  hơn 100 món ăn,nước uống , quán bánh ,ăn vặ....xlsx`. Tên, địa chỉ, nhóm món, khoảng giá và bữa gợi ý được giữ trong `data/restaurants.json`, cùng tên file và số dòng nguồn. Có mục chỉ chuỗi, chợ, nhiều chi nhánh hoặc địa chỉ gần đúng; có thể trùng. Không khẳng định đây là 105 chi nhánh đang hoạt động hoặc đã đồng ý hợp tác.

78/105 món ban đầu có liên kết quán trực tiếp, 14 món có công thức, 90/105 món có ít nhất một trong hai. Liên kết `related` chỉ là món cùng nhóm; không xác nhận quán bán đúng biến thể. Không suy giá từng món từ khoảng giá của quán. Bữa gợi ý không phải giờ mở cửa hoặc tình trạng còn món.

## Hình ảnh

Hầu hết ảnh là minh họa từ các URL Unsplash có trong workbook; không phải ảnh xác minh của quán. Ba ảnh nguồn chính thức được ghi trong metadata: Madame Lân (`https://madamelan.vn/`), Pizza 4P's Indochina (`https://pizza4ps.com/vn/location/944/?lang=vietnamese`) và Bếp Cuốn (`https://bepcuon.net/`). Ảnh tải từ website chính thức không tự cấp quyền xuất bản lại. Cần kiểm tra giấy phép/được chủ sở hữu cho phép trước khi phát hành công khai, hoặc thay bằng ảnh có quyền sử dụng rõ ràng.

## Công thức và nhãn

`data/recipes.json` là nguồn duy nhất của 14 công thức biên tập tham khảo, giữ tên và URL tác giả nguồn. Công thức không đại diện cho bí quyết riêng của quán.

Nhãn ăn chay có phạm vi riêng và phân biệt nguồn khai báo với phiên bản đã rà soát. Nhãn dinh dưỡng áp dụng cho đúng phiên bản và khẩu phần tham khảo; không truyền nhãn sang suất ăn của quán. Tiêu chí đối chiếu: đường ≤5 g/100 g rắn, ≤2,5 g/100 ml lỏng; năng lượng ≤40 kcal/100 g rắn, ≤20 kcal/100 ml lỏng. Không gán ít tinh bột khi chưa có ngưỡng phù hợp. Nguồn, số liệu và giới hạn nằm trong metadata và `data/nutrition-research.json`; đây không phải chứng nhận dinh dưỡng tại Việt Nam.

## Hồ sơ do quán gửi

Chủ quán đăng nhập và gửi địa chỉ, đại diện, liên hệ, nguồn thực đơn HTTPS, món, giá nguyên VND và đồng ý dùng dữ liệu/ảnh. Mỗi hồ sơ hỗ trợ 1–50 món. Lưu nháp vẫn yêu cầu thông tin hợp lệ; chưa gửi hoặc chưa duyệt sẽ không được công bố.

Quản trị viên tự đối chiếu đúng chủ thể, chi nhánh, nguồn, ảnh và giá trước khi duyệt. Khi duyệt, một transaction công bố quán, cập nhật món và liên kết, đồng thời gỡ các món cũ bị bỏ khỏi menu. Hệ thống không tự chứng nhận sự thật của nguồn hoặc tình trạng còn bán. Chủ quán không được tự gán nhãn ăn chay/dinh dưỡng hoặc tự nâng quyền admin.

Contact email, người đại diện và ghi chú duyệt nằm trong bảng hồ sơ chỉ chủ hồ sơ và admin được đọc. Số điện thoại của quán là thông tin công khai sau khi duyệt. Lịch sử thay đổi giữ ở schema `private`, không cho frontend truy cập.

Link giao đồ ăn phải thuộc `food.grab.com` hoặc `shopeefood.vn` và đúng chi nhánh. Nút tìm món chung chỉ mở nền tảng; chọn tỉnh/thành theo danh sách 63 đơn vị cũ không gửi vị trí hoặc thiết lập địa chỉ giao hàng. Website không tạo đơn, thu tiền hoặc điều phối shipper.
