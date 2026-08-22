// data.js
let state = null;
let saveTimer = null;

function defaultState() {
  const names = [
    "Nguyễn Minh Bình", "Trần Thị Ngọc Diệp", "Nguyễn Phan Ngọc Hân", "Lê Đức Hậu",
    "Đặng Công Quốc Huy", "Huỳnh Ngọc Hoàng Huy", "Phạm Gia Huy", "Ngô Hoàng Gia Hưng",
    "Phạm Tuấn Hưng", "Lâm Trần Khang", "Nguyễn Vĩnh Khang", "Nguyễn Thị Hồng My",
    "Hà Phước Nghĩa", "Dương Thị Thu Ngoan", "Lê Đặng Nhật", "Lê Trần Uyên Nhi",
    "Nguyễn Thị Tuyết Nhi", "Vũ Quỳnh Như", "Thái Tiến Phú", "Ngô Thanh Phước",
    "Kiều Nguyễn Lan Phương", "Phạm Thảo Phương", "Nguyễn Vũ Lộc Thành", "Võ Hồ Minh Thư",
    "Lê Văn Toàn", "Nguyễn Thị Thu Trang", "Nguyễn Thị Phước Trâm", "Trần Thị Thùy Trâm",
    "Nguyễn Ngọc Trâm", "Phạm Nguyễn Bảo Trân", "Nguyễn Thanh Trúc", "Trần Thị Thanh Trúc",
    "Lê Văn Tú", "Lê Huỳnh Văn Tùng", "Phan Thành Vinh", "Huỳnh Nữ Thu Yên", "Đặng Văn Hà"
  ];
  const students = names.map((n, i) => ({
    id: 's' + (i + 1),
    name: n,
    group: (i % 4) + 1,
    joinDate: todayISO()
  }));
  const rules = [
    { id: 'r1', group: 'study', icon: '✅', text: 'Đạt 7 điểm', desc: 'Áp dụng cho mọi hình thức kiểm tra', points: 1, teacherInput: false },
    { id: 'r2', group: 'study', icon: '✅', text: 'Đạt 8 điểm', desc: 'Áp dụng cho mọi hình thức kiểm tra', points: 5, teacherInput: false },
    { id: 'r3', group: 'study', icon: '✅', text: 'Đạt 9 điểm', desc: 'Áp dụng cho mọi hình thức kiểm tra', points: 7, teacherInput: false },
    { id: 'r4', group: 'class', icon: '✅', text: 'Đạt 10 điểm', desc: 'Áp dụng cho mọi hình thức kiểm tra', points: 10, teacherInput: false },
    { id: 'r5', group: 'class', icon: '✋', text: 'Tích cực giơ tay phát biểu', desc: 'Giáo viên tự nhập số điểm', points: 0, teacherInput: true },
    { id: 'r6', group: 'special', icon: '🌟', text: 'Được giáo viên khen tích cực', desc: 'Có ý kiến phát biểu hay, sáng tạo', points: 20, teacherInput: false },
    { id: 'r7', group: 'special', icon: '⭐', text: 'Ban cán sự hoàn thành nhiệm vụ', desc: 'Cộng 20 điểm mỗi tuần', points: 20, teacherInput: false },
    { id: 'r8', group: 'special', icon: '📅', text: 'Đi học chuyên cần', desc: 'Có mặt đủ cả hai buổi: +5 điểm', points: 5, teacherInput: false },
    { id: 'r9', group: 'deduct', icon: '🖌️', text: 'Để vật dụng thiếu gọn gàng', desc: 'Trừ 10 điểm', points: -10, teacherInput: false },
    { id: 'r10', group: 'deduct', icon: '🚫', text: 'Nói chuyện riêng bị nhắc tên', desc: 'Trừ 5 điểm', points: -5, teacherInput: false },
    { id: 'r11', group: 'deduct', icon: '🕒', text: 'Đi trễ', desc: 'Trừ 10 điểm/buổi', points: -10, teacherInput: false },
    { id: 'r12', group: 'deduct', icon: '○', text: 'Vắng học có phép', desc: 'Trừ 10 điểm/buổi', points: -10, teacherInput: false },
    { id: 'r13', group: 'deduct', icon: '!', text: 'Vắng học không phép', desc: 'Trừ 20 điểm/buổi', points: -20, teacherInput: false },
    { id: 'r14', group: 'deduct', icon: '⛔', text: 'Ban cán sự làm sai quy định', desc: 'Trừ 40 điểm/tuần', points: -40, teacherInput: false }
  ];
  const logs = [];
  const attendance = {};
  return {
    classInfo: {
      school: 'THCS&THPT Hiển Nhân',
      className: '11B1',
      teacher: 'Trần Thị Nguyệt',
      schoolYear: '2026–2027',
      week1Start: '2026-08-10',
      week2Start: '2026-08-17',
      totalWeeks: 38,
      hk1Weeks: 18,
      numGroups: 4,
      password: APP_PASSWORD
    },
    students,
    rules,
    logs,
    attendance,
    officers: [
      { id: 'o1', role: 'Lớp trưởng', studentId: '' },
      { id: 'o2', role: 'Lớp phó học tập', studentId: '' },
      { id: 'o3', role: 'Lớp phó lao động', studentId: '' },
      { id: 'o4', role: 'Tổ trưởng tổ 1', studentId: '' },
      { id: 'o5', role: 'Tổ trưởng tổ 2', studentId: '' },
      { id: 'o6', role: 'Tổ trưởng tổ 3', studentId: '' },
      { id: 'o7', role: 'Tổ trưởng tổ 4', studentId: '' }
    ]
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { state = defaultState(); return; }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.students) || parsed.students.length === 0) {
      state = defaultState();
      return;
    }
    if (!parsed.classInfo) parsed.classInfo = defaultState().classInfo;
    if (!parsed.officers) parsed.officers = defaultState().officers;
    if (!parsed.rules) parsed.rules = defaultState().rules;
    if (!parsed.logs) parsed.logs = [];
    if (!parsed.attendance) parsed.attendance = {};
    state = parsed;
  } catch (e) {
    console.error(e);
    state = defaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
  }
}

function queueSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}

// ---------- Data queries ----------
function attendanceDelta(studentId, dateStr) {
  const day = state.attendance[dateStr];
  if (!day || !day[studentId]) return 0;
  const { morning, afternoon } = day[studentId];
  let pts = 0;
  [morning, afternoon].forEach(v => {
    if (v === 'late') pts -= 10;
    else if (v === 'excused') pts -= 10;
    else if (v === 'absent') pts -= 20;
  });
  if (morning === 'present' && afternoon === 'present') pts += 5;
  return pts;
}

function studentAttendancePoints(studentId) {
  let total = 0;
  Object.keys(state.attendance).forEach(d => total += attendanceDelta(studentId, d));
  return total;
}

function studentLogPoints(studentId) {
  return state.logs.filter(l => l.studentId === studentId).reduce((a, b) => a + b.points, 0);
}

function studentTotalPoints(studentId) {
  return studentLogPoints(studentId) + studentAttendancePoints(studentId);
}

function rankedStudents() {
  return [...state.students].map(s => ({ ...s, pts: studentTotalPoints(s.id) })).sort((a, b) => b.pts - a.pts);
}

function rankedGroups() {
  const nums = [...new Set(state.students.map(s => s.group))].sort((a, b) => a - b);
  return nums.map(g => ({
    group: g,
    total: state.students.filter(s => s.group === g).reduce((sum, s) => sum + studentTotalPoints(s.id), 0),
    count: state.students.filter(s => s.group === g).length
  })).sort((a, b) => b.total - a.total);
}

function groupMembers(g) {
  return state.students.filter(s => s.group === g);
}

function currentWeekNumber() {
  const start = dateFromISO(state.classInfo.week1Start);
  const step = (new Date(state.classInfo.week2Start) - new Date(state.classInfo.week1Start)) / 86400000 || 7;
  const diff = diffDays(new Date(), start);
  if (diff < 0) return 0;
  return Math.floor(diff / step) + 1;
}

function weekRange(wk) {
  const start = dateFromISO(state.classInfo.week1Start);
  const step = (new Date(state.classInfo.week2Start) - new Date(state.classInfo.week1Start)) / 86400000 || 7;
  const s = new Date(start);
  s.setDate(s.getDate() + (wk - 1) * step);
  const e = new Date(s);
  e.setDate(e.getDate() + step - 1);
  return { start: s, end: e };
}