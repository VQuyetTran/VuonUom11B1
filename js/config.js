// js/config.js
// Cấu hình trung tâm của ứng dụng

const CLASS_INFO = {
  schoolName: "THCS&THPT Hiển Nhân",
  className: "11B1",
  teacher: "Trần Thị Nguyệt",
  schoolYear: "2026–2027",
  websiteName: "VƯỜN ƯƠM HẠNH PHÚC"
};

const APP_PASSWORD = "admin123"; // Mật khẩu dành cho giáo viên (có thể thay đổi)

const NUM_TEAMS = 4;
const WEEK1_START = "2026-08-10"; // Thứ Hai của tuần 1 (yyyy-mm-dd)

const STUDENT_NAMES = [
  "Diệp Thế Gia Bảo", "Nguyễn Minh Bình", "Trần Thị Ngọc Diệp", "Nguyễn Phan Ngọc Hân", "Lê Đức Hậu",
  "Đặng Công Quốc Huy", "Huỳnh Ngọc Hoàng Huy", "Phạm Gia Huy", "Ngô Hoàng Gia Hưng", "Phạm Tuấn Hưng",
  "Lâm Trần Khang", "Nguyễn Vĩnh Khang", "Nguyễn Thị Hồng My", "Hà Phước Nghĩa", "Dương Thị Thu Ngoan",
  "Lê Đặng Nhật", "Lê Trần Uyên Nhi", "Nguyễn Thị Tuyết Nhi", "Vũ Quỳnh Như", "Thái Tiến Phú",
  "Ngô Thanh Phước", "Kiều Nguyễn Lan Phương", "Phạm Thảo Phương", "Nguyễn Vũ Lộc Thành", "Võ Hồ Minh Thư",
  "Lê Văn Toàn", "Nguyễn Thị Thu Trang", "Nguyễn Thị Phước Trâm", "Trần Thị Thùy Trâm", "Nguyễn Ngọc Trâm",
  "Phạm Nguyễn Bảo Trân", "Nguyễn Thanh Trúc", "Trần Thị Thanh Trúc", "Lê Văn Tú", "Lê Huỳnh Văn Tùng",
  "Phan Thành Vinh", "Huỳnh Nữ Thu Yên", "Đặng Văn Hà"
];

// Cấp độ phát triển của cây
const LEVELS = [
  { threshold: 0, name: "Hạt giống", icon: "🌱", color: "#8bc78e" },
  { threshold: 40, name: "Mầm non", icon: "🌿", color: "#5fae6b" },
  { threshold: 90, name: "Cây con", icon: "🌳", color: "#3f9a54" },
  { threshold: 150, name: "Cây trưởng thành", icon: "🌲", color: "#2e8b57" },
  { threshold: 220, name: "Cây ra hoa", icon: "🌸", color: "#e07ba0" },
  { threshold: 300, name: "Cây kết trái", icon: "🍎", color: "#d9534f" },
  { threshold: 400, name: "Cây cổ thụ", icon: "🌳✨", color: "#caa23c" }
];

// Quy định cộng / trừ điểm
const POINT_RULES = [
  { id: "r1", group: "daily", label: "Phát biểu xây dựng bài", points: 5 },
  { id: "r2", group: "daily", label: "Đi học đúng giờ & gọn gàng", points: 5 },
  { id: "r3", group: "daily", label: "Chuẩn bị bài & đủ sách vở", points: 5 },
  { id: "r4", group: "daily", label: "Giữ vệ sinh chỗ ngồi & phòng học", points: 5 },
  { id: "r5", group: "daily", label: "Có tiến bộ trong tiết học", points: 5 },
  { id: "r6", group: "daily", label: "Hoàn thành bài tập về nhà", points: 5 },
  { id: "r7", group: "achieve", label: "Đạt điểm tốt (8 - 9 điểm)", points: 10 },
  { id: "r8", group: "achieve", label: "Giúp đỡ bạn bè / Việc làm tử tế", points: 10 },
  { id: "r9", group: "achieve", label: "Tích cực tham gia phong trào", points: 10 },
  { id: "r10", group: "achieve", label: "Hoàn thành xuất sắc nhiệm vụ Tổ/Lớp", points: 10 },
  { id: "r11", group: "special", label: "Đạt điểm 10 tuyệt đối", points: 20 },
  { id: "r12", group: "special", label: "Đạt giải cuộc thi các cấp", points: 20 },
  { id: "r13", group: "special", label: "Việc tốt tiêu biểu / Dũng cảm", points: 20 },
  { id: "r14", group: "minor", label: "Đi học muộn / Tập trung chậm", points: -5 },
  { id: "r15", group: "minor", label: "Không làm bài tập / Thiếu chuẩn bị", points: -5 },
  { id: "r16", group: "minor", label: "Mất trật tự trong giờ học", points: -5 },
  { id: "r17", group: "medium", label: "Sai đồng phục / tác phong", points: -10 },
  { id: "r18", group: "medium", label: "Bỏ trực nhật Lớp/Tổ", points: -10 },
  { id: "r19", group: "medium", label: "Nhắc nhở nhiều lần vẫn tái phạm", points: -10 },
  { id: "r20", group: "serious", label: "Vi phạm nội quy nghiêm trọng", points: -20 }
];

// Huy hiệu
const BADGE_CONFIG = [
  {
    id: "b1", name: "Chăm chỉ", icon: "🐝", desc: "Tích lũy ≥ 8 lượt đi học đúng giờ / chuẩn bị bài / hoàn thành BTVN",
    check: (ctx) => ctx.countRules(["r2", "r3", "r6"]) >= 8
  },
  {
    id: "b2", name: "Tiến bộ", icon: "📈", desc: "Được ghi nhận ≥ 3 lần 'Có tiến bộ trong tiết học'",
    check: (ctx) => ctx.countRules(["r5"]) >= 3
  },
  {
    id: "b3", name: "Học tập tích cực", icon: "🙋", desc: "Phát biểu xây dựng bài ≥ 5 lần",
    check: (ctx) => ctx.countRules(["r1"]) >= 5
  },
  {
    id: "b4", name: "Gương mẫu", icon: "🌟", desc: "Đi học đúng giờ ≥ 10 lần và không vi phạm nghiêm trọng",
    check: (ctx) => ctx.countRules(["r2"]) >= 10 && ctx.countRules(["r20"]) === 0
  },
  {
    id: "b5", name: "Hỗ trợ tập thể", icon: "🤝", desc: "Giúp đỡ bạn bè hoặc hoàn thành xuất sắc nhiệm vụ tổ ≥ 3 lần",
    check: (ctx) => ctx.countRules(["r8", "r10"]) >= 3
  },
  {
    id: "b6", name: "Thành viên nổi bật", icon: "🏅", desc: "Có tổng điểm cao nhất trong tổ hiện tại",
    check: (ctx) => ctx.isTeamTop()
  },
  {
    id: "b7", name: "Ngôi sao của tuần", icon: "⭐", desc: "Có điểm cộng ròng cao nhất lớp trong tuần hiện tại",
    check: (ctx) => ctx.isWeekStar()
  }
];

const SEMESTERS = {
  hk1: { label: "Học kì I", start: 1, end: 18 },
  hk2: { label: "Học kì II", start: 19, end: 35 }
};

const STORAGE_KEY = "vuon_uom_11b1_data_v1";
const DATA_VERSION = 1;