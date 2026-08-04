const classInfo = {
    name: "VƯỜN ƯƠM HẠNH PHÚC",
    className: "11B1",
    teacher: "Trần Thị Nguyệt",
    school: "THCS&THPT Hiển Nhân",
    academicYear: "2026–2027",
    startDateWeek1: new Date("2026-08-10T00:00:00"),
    totalGroups: 4
};

const levels = [
    { minPts: -Infinity, maxPts: 0, title: "Hạt mầm", icon: "🌱" },
    { minPts: 1, maxPts: 20, title: "Mầm nhỏ", icon: "🌿" },
    { minPts: 21, maxPts: 50, title: "Cây con", icon: "🪴" },
    { minPts: 51, maxPts: 100, title: "Cây phát triển", icon: "🌳" },
    { minPts: 101, maxPts: Infinity, title: "Cây cổ thụ", icon: "🌲" }
];

const badges = [
    { id: "cham-chi", name: "Chăm chỉ", icon: "⭐", condition: "Đạt từ 20 điểm trở lên" },
    { id: "tien-bo", name: "Tiến bộ", icon: "📈", condition: "Có điểm tích cực trong tuần" },
    { id: "guong-mau", name: "Gương mẫu", icon: "🎖️", condition: "Không vi phạm nội quy" }
];

const rules = [
    { id: 1, name: "Phát biểu xây dựng bài", pts: 5, type: "plus" },
    { id: 2, name: "Đi học đúng giờ và gọn gàng", pts: 5, type: "plus" },
    { id: 3, name: "Có tiến bộ trong tiết học", pts: 5, type: "plus" },
    { id: 4, name: "Chuẩn bị bài và đủ sách vở", pts: 5, type: "plus" },
    { id: 5, name: "Giữ vệ sinh chổ ngồi và phòng học", pts: 5, type: "plus" },
    { id: 6, name: "Hoàn thành bài tập về nhà", pts: 5, type: "plus" },
    { id: 7, name: "Giúp đỡ bạn bè/ Việc làm tử tế", pts: 10, type: "plus" },
    { id: 8, name: "Hoàn thành xuất sắc nhiệm vụ Tổ/Lớp", pts: 10, type: "plus" },
    { id: 9, name: "Đạt điểm tốt (8-9điểm)", pts: 10, type: "plus" },
    { id: 10, name: "Tích cực tham gia phong trào", pts: 10, type: "plus" },
    { id: 11, name: "Đạt điểm 10 tuyệt đối", pts: 20, type: "plus" },
    { id: 12, name: "Việc tốt tiêu biểu/ Dũng cảm", pts: 20, type: "plus" },
    { id: 13, name: "Đạt giải cuộc thi các cấp", pts: 20, type: "plus" },
    { id: 14, name: "Đi học muộn / Tập trung chậm", pts: -5, type: "minus" },
    { id: 15, name: "Không làm bài tập / Thiếu chuẩn bị", pts: -5, type: "minus" },
    { id: 16, name: "Mất trật tự trong giờ học", pts: -5, type: "minus" },
    { id: 17, name: "Sai đồng phục / tác phong", pts: -10, type: "minus" },
    { id: 18, name: "Bỏ trực nhật Lớp/Tổ", pts: -10, type: "minus" },
    { id: 19, name: "Nhắc nhở nhiều lần vẫn tái phạm", pts: -10, type: "minus" },
    { id: 20, name: "Vi phạm nội quy nghiêm trọng", pts: -20, type: "minus" }
];

const semesters = {
    term1: { name: "Học kì I", startWeek: 1, endWeek: 18 },
    term2: { name: "Học kì II", startWeek: 19, endWeek: 35 }
};

const DEFAULT_STUDENTS = [
    "Diệp Thế Gia Bảo", "Nguyễn Minh Bình", "Trần Thị Ngọc Diệp", "Nguyễn Phan Ngọc Hân",
    "Lê Đức Hậu", "Đặng Công Quốc Huy", "Huỳnh Ngọc Hoàng Huy", "Phạm Gia Huy",
    "Ngô Hoàng Gia Hưng", "Phạm Tuấn Hưng", "Lâm Trần Khang", "Nguyễn Vĩnh Khang",
    "Nguyễn Thị Hồng My", "Hà Phước Nghĩa", "Dương Thị Thu Ngoan", "Lê Đặng Nhật",
    "Lê Trần Uyên Nhi", "Nguyễn Thị Tuyết Nhi", "Vũ Quỳnh Như", "Thái Tiến Phú",
    "Ngô Thanh Phước", "Kiều Nguyễn Lan Phương", "Phạm Thảo Phương", "Nguyễn Vũ Lộc Thành",
    "Võ Hồ Minh Thư", "Lê Văn Toàn", "Nguyễn Thị Thu Trang", "Nguyễn Thị Phước Trâm",
    "Trần Thị Thùy Trâm", "Nguyễn Ngọc Trâm", "Phạm Nguyễn Bảo Trân", "Nguyễn Thanh Trúc",
    "Trần Thị Thanh Trúc", "Lê Văn Tú", "Lê Huỳnh Văn Tùng", "Phan Thành Vinh",
    "Huỳnh Nữ Thu Yên", "Đặng Văn Hà"
];