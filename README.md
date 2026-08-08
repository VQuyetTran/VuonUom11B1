# 🌱 VƯỜN ƯƠM HẠNH PHÚC – Lớp 10/5

Hệ thống quản lý thi đua lớp học với giao diện trực quan, tích hợp cây phát triển, bảng xếp hạng, nhật ký và tổng kết.

## 🚀 Tính năng chính
- Quản lý học sinh, phân tổ, chuyển tổ.
- Ghi nhận điểm cộng/trừ theo quy định.
- Cấp độ phát triển và huy hiệu tự động.
- Bảng xếp hạng cá nhân và tổ.
- Nhật ký hoạt động với bộ lọc và hoàn tác.
- Tổng kết theo tuần, tháng, học kì.
- Lưu trữ dữ liệu bằng `localStorage`, xuất/nhập JSON.

## 📁 Cấu trúc thư mục
Vuon_uom_11B1/
├── index.html
├── css/
│ └── style.css
├── js/
│ ├── config.js
│ ├── data.js
│ ├── ui.js
│ ├── events.js
│ └── main.js
└── README.md

## 🔧 Cách tùy chỉnh
- **Thông tin lớp, quy định, cấp độ, huy hiệu**: sửa trong `js/config.js`.
- **Danh sách học sinh**: sửa mảng `DEFAULT_STUDENTS` trong `js/config.js`.
- **Màu sắc, bố cục**: sửa trong `css/style.css`.
- **Dữ liệu mẫu**: được khởi tạo tự động nếu chưa có dữ liệu trong localStorage.

## 📦 Cài đặt và chạy
1. Tải toàn bộ thư mục về máy.
2. Mở file `index.html` bằng trình duyệt (Chrome, Edge,…).
3. Không cần kết nối Internet, mọi dữ liệu được lưu cục bộ.

## 📝 Ghi chú
- Dữ liệu được lưu tự động sau mỗi thao tác.
- Có thể sao lưu dữ liệu dạng JSON và khôi phục khi cần.
- Nút "Đặt lại dữ liệu" sẽ xóa toàn bộ dữ liệu hiện tại và tạo lại danh sách mặc định.