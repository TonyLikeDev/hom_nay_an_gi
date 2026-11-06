# Hôm nay ăn gì?

Trang web chọn món cho những lúc không biết ăn gì. Đồ án môn Advanced Web Design, Nhóm 3, năm 2026.

HTML, CSS và JavaScript thuần, không cần cài đặt hay build. Chạy thử:

```
python -m http.server 8000
```

rồi mở http://localhost:8000.

- `index.html`: lời chào theo giờ, hai nút lớn
- `cuisines.html`: 6 nền ẩm thực và máy quay xèng "Bất ngờ đi!"
- `result.html`: kết quả, nhận `?mode=any`, `?cuisine=viet` hoặc `?dish=pho-bo`
- `dishes.html`: 30 món, lọc theo ẩm thực và bữa ăn
- `about.html`: quy trình thiết kế và nguồn ảnh
- `js/data.js`: toàn bộ dữ liệu món ăn
- `js/app.js`: header và cách chọn món
hello