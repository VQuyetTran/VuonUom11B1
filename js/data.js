// js/data.js
// Quản lý dữ liệu và các hàm xử lý logic liên quan đến DB

let DB = loadDB();

function buildInitialData() {
  const students = STUDENT_NAMES.map((name, i) => ({
    id: "hs" + (i + 1),
    name: name,
    team: (i % NUM_TEAMS) + 1,
    points: 0,
    createdAt: todayISO()
  }));
  return {
    version: DATA_VERSION,
    classInfo: CLASS_INFO,
    numTeams: NUM_TEAMS,
    week1Start: WEEK1_START,
    students: students,
    logs: [],
    summaries: [],
    lastAction: null,
    presentMode: false,
    meta: { createdAt: new Date().toISOString() }
  };
}

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialData();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.students) || parsed.students.length === 0) {
      return buildInitialData();
    }
    if (!parsed.version) parsed.version = DATA_VERSION;
    if (!parsed.summaries) parsed.summaries = [];
    if (!parsed.logs) parsed.logs = [];
    if (parsed.presentMode === undefined) parsed.presentMode = false;
    return parsed;
  } catch (e) {
    console.error("Lỗi đọc dữ liệu, dùng dữ liệu khởi tạo mới.", e);
    return buildInitialData();
  }
}

function saveDB() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
  } catch (e) {
    toast("⚠️ Không thể lưu dữ liệu (bộ nhớ trình duyệt đầy hoặc bị chặn).", false);
  }
}

// =========================================================
// Các hàm tiện ích chung
// =========================================================
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function todayISO() { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function nowDateTimeStr() { const d = new Date(); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function dateFromISO(iso) { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); }
function diffDays(a, b) { return Math.round((a - b) / 86400000); }
function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function fmtDate(d) { return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear(); }
function abbreviate(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const last = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(p => p[0] + ".").join("");
  return initials + " " + last;
}
function displayName(name) { return DB.presentMode ? abbreviate(name) : name; }

function ruleById(id) { return POINT_RULES.find(r => r.id === id); }

function teamColor(t) { const c = ["var(--team1)", "var(--team2)", "var(--team3)", "var(--team4)"]; return c[(t - 1) % 4]; }

// =========================================================
// Cấp độ / Huy hiệu
// =========================================================
function getLevel(points) {
  let lvl = LEVELS[0];
  for (const l of LEVELS) {
    if (points >= l.threshold) lvl = l;
  }
  return lvl;
}
function getNextLevel(points) {
  for (const l of LEVELS) {
    if (l.threshold > points) return l;
  }
  return null;
}
function levelProgress(points) {
  const cur = getLevel(points),
    next = getNextLevel(points);
  if (!next) return { pct: 100, remain: 0, nextName: null };
  const span = next.threshold - cur.threshold;
  const done = points - cur.threshold;
  return { pct: Math.max(0, Math.min(100, Math.round(done / span * 100))), remain: next.threshold - points, nextName: next.name };
}

function studentBadges(student) {
  const logs = DB.students ? DB.logs.filter(l => l.studentId === student.id) : [];
  const ctx = {
    countRules: (ids) => logs.filter(l => l.type !== "revert" && ids.includes(l.ruleId)).length,
    isTeamTop: () => {
      const mates = DB.students.filter(s => s.team === student.team);
      const max = Math.max(...mates.map(s => s.points));
      return mates.length > 0 && student.points === max && max > 0;
    },
    isWeekStar: () => {
      const wk = currentWeekNumber();
      if (wk < 1) return false;
      const range = weekRange(wk);
      const gains = DB.students.map(s => ({ id: s.id, net: netPointsInRange(s.id, range.start, range.end) }));
      const max = Math.max(...gains.map(g => g.net));
      const mine = gains.find(g => g.id === student.id);
      return max > 0 && mine && mine.net === max;
    }
  };
  return BADGE_CONFIG.filter(b => {
    try { return b.check(ctx); } catch (e) { return false; }
  });
}

// =========================================================
// Tuần / Thời gian
// =========================================================
function currentWeekNumber(dateObj) {
  const d = dateObj || new Date();
  const start = dateFromISO(DB.week1Start);
  const diff = diffDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), start);
  if (diff < 0) return 0;
  return Math.floor(diff / 7) + 1;
}
function weekRange(weekNum) {
  const start = dateFromISO(DB.week1Start);
  const s = new Date(start);
  s.setDate(s.getDate() + (weekNum - 1) * 7);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  return { start: s, end: e };
}
function semesterOfWeek(wk) {
  if (wk >= SEMESTERS.hk1.start && wk <= SEMESTERS.hk1.end) return "hk1";
  if (wk >= SEMESTERS.hk2.start && wk <= SEMESTERS.hk2.end) return "hk2";
  return null;
}
function logsInRange(fromISO, toISO) {
  return DB.logs.filter(l => l.dateISO >= fromISO && l.dateISO <= toISO);
}
function netPointsInRange(studentId, fromDate, toDate) {
  const fromISO = isoOf(fromDate),
    toISO = isoOf(toDate);
  return DB.logs.filter(l => l.studentId === studentId && l.dateISO >= fromISO && l.dateISO <= toISO && (l.type === "plus" || l.type === "minus"))
    .reduce((s, l) => s + l.points, 0);
}

// =========================================================
// Thống kê tổ
// =========================================================
function teamAggregates() {
  const arr = [];
  for (let t = 1; t <= DB.numTeams; t++) {
    const members = DB.students.filter(s => s.team === t);
    const total = members.reduce((s, x) => s + x.points, 0);
    arr.push({ team: t, members, total, avg: members.length ? Math.round(total / members.length * 10) / 10 : 0 });
  }
  return arr;
}

function rankMapByPoints() {
  const sorted = DB.students.slice().sort((a, b) => b.points - a.points);
  const map = {};
  let rank = 0,
    prevPts = null,
    seen = 0;
  sorted.forEach(s => {
    seen++;
    if (s.points !== prevPts) { rank = seen;
      prevPts = s.points; }
    map[s.id] = rank;
  });
  return map;
}

// =========================================================
// Các hàm thao tác dữ liệu (cộng điểm, chuyển tổ, hoàn tác)
// =========================================================
function addPointLog(student, rule, note) {
  const before = student.points;
  student.points = Math.max(0, student.points + rule.points);
  const log = {
    id: uid(),
    studentId: student.id,
    studentName: student.name,
    team: student.team,
    type: rule.points > 0 ? "plus" : "minus",
    ruleId: rule.id,
    content: rule.label,
    points: rule.points,
    note: note || "",
    dateISO: todayISO(),
    time: nowDateTimeStr(),
    actor: DB.classInfo.teacher
  };
  DB.logs.unshift(log);
  DB.lastAction = { kind: "point", logId: log.id, studentId: student.id, delta: rule.points, before: before };
  saveDB();
  return log;
}

function transferStudent(student, newTeam) {
  const oldTeam = student.team;
  if (oldTeam === newTeam) return null;
  student.team = newTeam;
  const log = {
    id: uid(),
    studentId: student.id,
    studentName: student.name,
    team: newTeam,
    type: "transfer",
    content: "Chuyển từ Tổ " + oldTeam + " sang Tổ " + newTeam,
    points: 0,
    note: "",
    dateISO: todayISO(),
    time: nowDateTimeStr(),
    actor: DB.classInfo.teacher,
    oldTeam: oldTeam
  };
  DB.logs.unshift(log);
  DB.lastAction = { kind: "transfer", logId: log.id, studentId: student.id, oldTeam: oldTeam, newTeam: newTeam };
  saveDB();
  return log;
}

function evenlyDistributeTeams() {
  DB.students.forEach((s, i) => { s.team = (i % DB.numTeams) + 1; });
  const log = {
    id: uid(),
    studentId: "",
    studentName: "Toàn lớp",
    team: 0,
    type: "transfer",
    content: "Xếp đều toàn bộ học sinh vào " + DB.numTeams + " tổ theo thứ tự danh sách",
    points: 0,
    note: "",
    dateISO: todayISO(),
    time: nowDateTimeStr(),
    actor: DB.classInfo.teacher
  };
  DB.logs.unshift(log);
  DB.lastAction = null;
  saveDB();
  toast("Đã xếp đều học sinh vào " + DB.numTeams + " tổ.");
  renderAll();
}

function undoLast() {
  const act = DB.lastAction;
  if (!act) { toast("Không có thao tác nào để hoàn tác."); return; }
  if (act.kind === "point") {
    const s = DB.students.find(x => x.id === act.studentId);
    if (s) { s.points = act.before; }
    DB.logs = DB.logs.filter(l => l.id !== act.logId);
    toast("Đã hoàn tác thao tác ghi nhận điểm gần nhất.");
  } else if (act.kind === "transfer") {
    const s = DB.students.find(x => x.id === act.studentId);
    if (s) { s.team = act.oldTeam; }
    DB.logs = DB.logs.filter(l => l.id !== act.logId);
    toast("Đã hoàn tác lần chuyển tổ gần nhất.");
  }
  DB.lastAction = null;
  saveDB();
  renderAll();
}

function undoSpecificLog(logId) {
  const log = DB.logs.find(l => l.id === logId);
  if (!log) return;
  if (log.type === "plus" || log.type === "minus") {
    const s = DB.students.find(x => x.id === log.studentId);
    if (s) s.points = Math.max(0, s.points - log.points);
  } else if (log.type === "transfer" && log.oldTeam) {
    const s = DB.students.find(x => x.id === log.studentId);
    if (s) s.team = log.oldTeam;
  } else {
    toast("Không thể hoàn tác sự kiện này.");
    return;
  }
  DB.logs = DB.logs.filter(l => l.id !== logId);
  if (DB.lastAction && DB.lastAction.logId === logId) DB.lastAction = null;
  saveDB();
  toast("Đã hoàn tác sự kiện.");
  renderAll();
}

// Hàm export để sử dụng trong các file khác (nếu cần)
window.AppData = {
  DB,
  saveDB,
  loadDB,
  buildInitialData,
  getLevel,
  getNextLevel,
  levelProgress,
  studentBadges,
  currentWeekNumber,
  weekRange,
  semesterOfWeek,
  logsInRange,
  netPointsInRange,
  teamAggregates,
  rankMapByPoints,
  addPointLog,
  transferStudent,
  evenlyDistributeTeams,
  undoLast,
  undoSpecificLog,
  displayName,
  teamColor,
  ruleById,
  todayISO,
  nowDateTimeStr,
  uid,
  dateFromISO,
  diffDays,
  isoOf,
  fmtDate,
  abbreviate
};