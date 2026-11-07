# Services

Chứa nghiệp vụ cần phối hợp nhiều model hoặc dịch vụ bên ngoài, ví dụ lưu công thức kèm nguyên liệu và bước nấu trong một transaction.

Controller gọi service; service gọi model. Với thao tác đọc đơn giản, controller có thể gọi model trực tiếp. Không nhận `req`, `res` ở tầng này.
