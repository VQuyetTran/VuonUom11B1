// ============================================================
// FILE: data.js
// Quản lý trạng thái ứng dụng, lưu trữ localStorage, khởi tạo dữ liệu, các hàm tiện ích
// ============================================================

const STORAGE_KEY = 'VuonUom11B1_data';
const VERSION = '1.0';

let appData = {
    students: [],
    events: [],
    summaries: [],
    teamAssignments: {}, // studentId -> teamId (1..4)
    nextId: 1,
    lastTeamMove: null,
    lastEventId: null,
};

// ----- Hàm lưu/đọc dữ liệu -----
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            if (parsed.version === VERSION) {
                appData = parsed.data;
                return true;
            }
        } catch (e) {
            console.warn('Lỗi đọc dữ liệu', e);
        }
    }
    return false;
}

function saveData() {
    const payload = { version: VERSION, data: appData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function initDefaultData() {
    const students = DEFAULT_STUDENTS.map((name) => ({
        id: generateId(),
        name: name.trim(),
        points: 0,
    }));
    appData.students = students;
    const numTeams = CONFIG.classInfo.numTeams;
    students.forEach((s, i) => {
        appData.teamAssignments[s.id] = (i % numTeams) + 1;
    });
    appData.events = [];
    appData.summaries = [];
    appData.lastTeamMove = null;
    appData.lastEventId = null;
    saveData();
}

function ensureData() {
    if (!loadData()) {
        initDefaultData();
        loadData();
    }
    // Đảm bảo mọi học sinh đều có tổ
    appData.students.forEach(s => {
        if (!appData.teamAssignments[s.id]) {
            appData.teamAssignments[s.id] = 1;
        }
    });
    saveData();
}

// ----- Hàm tiện ích (helpers) -----
function generateId() {
    return appData.nextId++;
}

function getStudentById(id) {
    return appData.students.find(s => s.id === id);
}

function getTeamStudents(teamId) {
    return appData.students.filter(s => appData.teamAssignments[s.id] === teamId);
}

function getTeamPoints(teamId) {
    const members = getTeamStudents(teamId);
    return members.reduce((sum, s) => sum + s.points, 0);
}

function getTeamAvg(teamId) {
    const members = getTeamStudents(teamId);
    if (!members.length) return 0;
    return getTeamPoints(teamId) / members.length;
}

function getLevel(points) {
    const lv = CONFIG.levels.slice().reverse().find(l => points >= l.minPoints);
    return lv || CONFIG.levels[0];
}

function getBadges(student) {
    const earned = [];
    CONFIG.badges.forEach(b => {
        try {
            if (eval(b.condition.replace(/points/g, student.points))) {
                earned.push(b);
            }
        } catch (e) {}
    });
    return earned;
}

function getWeekNumber(dateStr) {
    const start = new Date(CONFIG.classInfo.startDate);
    const d = new Date(dateStr);
    const diff = Math.floor((d - start) / (7 * 24 * 60 * 60 * 1000));
    return diff + 1;
}

function getCurrentWeek() {
    const now = new Date();
    const start = new Date(CONFIG.classInfo.startDate);
    const diff = Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000));
    return diff + 1;
}

function formatDate(d) {
    if (!d) return '';
    const dt = new Date(d);
    return dt.toLocaleDateString('vi-VN') + ' ' + dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}