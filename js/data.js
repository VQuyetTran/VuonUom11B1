let appData = {
    students: [],
    logs: [],
    isAnonymized: false
};

const DATA_STORAGE_KEY = "VuonUom_11B1_data";

function loadData() {
    const saved = localStorage.getItem(DATA_STORAGE_KEY);
    if (saved) {
        appData = JSON.parse(saved);
    } else {
        initDefaultData();
    }
}

function saveData() {
    localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(appData));
}

function initDefaultData() {
    appData.students = DEFAULT_STUDENTS.map((name, index) => ({
        id: index + 1,
        name: name,
        group: (index % 4) + 1,
        score: 0,
        badges: []
    }));
    appData.logs = [];
    appData.isAnonymized = false;
    saveData();
}

function getTreeLevel(score) {
    return levels.find(lvl => score >= lvl.minPts && score <= lvl.maxPts) || levels[0];
}

function getCurrentWeek() {
    const now = new Date();
    const diffTime = now - classInfo.startDateWeek1;
    if (diffTime < 0) return "Chưa bắt đầu";
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return `Tuần ${Math.floor(diffDays / 7) + 1}`;
}

function formatStudentName(name) {
    if (!appData.isAnonymized) return name;
    const parts = name.trim().split(" ");
    if (parts.length <= 1) return name;
    return `${parts[0]} *** ${parts[parts.length - 1]}`;
}