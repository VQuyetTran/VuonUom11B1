// ============================================================
// FILE: config.js
// Chứa tất cả cấu hình: thông tin lớp, cấp độ, huy hiệu, quy định, học kì, danh sách mặc định
// ============================================================

const CONFIG = {
    classInfo: {
        name: '11B1',
        teacher: 'Trần Thị Nguyệt',
        school: 'THCS&THPT Hiển Nhân',
        year: '2026–2027',
        startDate: '2026-08-10', // Ngày bắt đầu Tuần 1 (định dạng YYYY-MM-DD)
        numTeams: 4,
    },
    // Các mốc cấp độ (tăng dần theo điểm)
    levels: [
        { minPoints: 0, label: 'Hạt giống', icon: '🌱', color: '#a3c9a0' },
        { minPoints: 20, label: 'Mầm non', icon: '🌿', color: '#7cb57a' },
        { minPoints: 50, label: 'Cây xanh', icon: '🌳', color: '#4d8f4a' },
        { minPoints: 100, label: 'Cây lớn', icon: '🌲', color: '#2d6b2a' },
        { minPoints: 200, label: 'Vườn hoa', icon: '🌸', color: '#b58a4a' },
    ],
    // Huy hiệu (điều kiện sử dụng biến `points`)
    badges: [
        { id: 'cham_chi', label: 'Chăm chỉ', icon: '⭐', condition: 'points >= 50' },
        { id: 'tien_bo', label: 'Tiến bộ', icon: '📈', condition: 'points >= 30' },
        { id: 'tich_cuc', label: 'Học tập tích cực', icon: '📚', condition: 'points >= 40' },
        { id: 'guong_mau', label: 'Gương mẫu', icon: '🌟', condition: 'points >= 70' },
        { id: 'ho_tro', label: 'Hỗ trợ tập thể', icon: '🤝', condition: 'points >= 25' },
        { id: 'noi_bat', label: 'Thành viên nổi bật', icon: '🏅', condition: 'points >= 100' },
        { id: 'sao_tuan', label: 'Ngôi sao của tuần', icon: '⭐', condition: 'points >= 60' },
    ],
    // Quy định cộng/trừ điểm
    rules: {
        positive: [
            { id: 'p1', label: 'Phát biểu xây dựng bài', points: 2 },
            { id: 'p2', label: 'Làm bài tập đầy đủ', points: 3 },
            { id: 'p3', label: 'Giúp đỡ bạn bè', points: 2 },
            { id: 'p4', label: 'Tham gia hoạt động tập thể', points: 3 },
            { id: 'p5', label: 'Đạt điểm cao trong kiểm tra', points: 5 },
            { id: 'p6', label: 'Tiến bộ rõ rệt', points: 4 },
            { id: 'p7', label: 'Có sáng kiến hay', points: 5 },
        ],
        negative: [
            { id: 'n1', label: 'Nói chuyện trong giờ', points: -2 },
            { id: 'n2', label: 'Không làm bài tập về nhà', points: -3 },
            { id: 'n3', label: 'Mất trật tự', points: -2 },
            { id: 'n4', label: 'Không tham gia hoạt động', points: -3 },
            { id: 'n5', label: 'Sai đồng phục / tác phong', points: -10 },
            { id: 'n6', label: 'Không chuẩn bị bài', points: -3 },
            { id: 'n7', label: 'Vi phạm nội quy', points: -5 },
        ]
    },
    // Học kì (tuần bắt đầu và kết thúc)
    semesters: [
        { id: 1, name: 'Học kì I', weekStart: 1, weekEnd: 18 },
        { id: 2, name: 'Học kì II', weekStart: 19, weekEnd: 35 },
    ]
};

// Danh sách học sinh mặc định (có thể thay thế)
const DEFAULT_STUDENTS = [
    'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Minh Châu', 'Phạm Hoàng Duy', 'Ngô Thị Lan',
    'Đào Văn Hải', 'Hoàng Minh Hiếu', 'Bùi Thị Hoa', 'Lý Quang Huy', 'Vũ Thị Hương',
    'Dương Văn Khánh', 'Trương Ngọc Linh', 'Lý Minh Long', 'Phạm Thị Mai', 'Nguyễn Văn Nam',
    'Trần Quốc Nhật', 'Lê Thanh Nga', 'Phan Văn Phú', 'Nguyễn Thị Quỳnh', 'Phạm Minh Sơn',
    'Lê Thị Thảo', 'Nguyễn Văn Tiến', 'Trần Thị Trang', 'Phạm Quang Trung', 'Hoàng Thị Tuyết',
    'Võ Văn Tài', 'Nguyễn Bảo Uyên', 'Phạm Thị Vân', 'Lý Gia Bảo', 'Trần Minh Đức'
];