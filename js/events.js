// ============================================================
// FILE: events.js
// Xử lý tất cả sự kiện: modal điểm, chi tiết, quản lý tổ, tổng kết, nhật ký, hoàn tác, tabs, ...
// ============================================================

// ----- Mở/đóng modal điểm -----
let currentScoreStudentId = null;

window.openScoreModal = function(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;
    currentScoreStudentId = studentId;
    document.getElementById('scoreStudentName').textContent = student.name;
    document.getElementById('scoreStudentTeam').textContent = appData.teamAssignments[studentId] || '?';
    document.getElementById('scoreCurrentPoints').textContent = student.points;
    // Populate rules
    const addSel = document.getElementById('scoreAddRule');
    addSel.innerHTML = '<option value="">-- Chọn --</option>';
    CONFIG.rules.positive.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.label + ' (+' + r.points + ')';
        opt.dataset.points = r.points;
        addSel.appendChild(opt);
    });
    const subSel = document.getElementById('scoreSubtractRule');
    subSel.innerHTML = '<option value="">-- Chọn --</option>';
    CONFIG.rules.negative.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        opt.textContent = r.label + ' (' + r.points + ')';
        opt.dataset.points = r.points;
        subSel.appendChild(opt);
    });
    document.getElementById('scoreNote').value = '';
    document.getElementById('scoreModal').classList.add('show');
};

function closeScoreModal() {
    document.getElementById('scoreModal').classList.remove('show');
    currentScoreStudentId = null;
}

document.getElementById('closeScoreModal').addEventListener('click', closeScoreModal);
document.getElementById('scoreCancel').addEventListener('click', closeScoreModal);

document.getElementById('scoreConfirm').addEventListener('click', function() {
    const studentId = currentScoreStudentId;
    if (!studentId) return;
    const student = getStudentById(studentId);
    if (!student) return;
    const addSel = document.getElementById('scoreAddRule');
    const subSel = document.getElementById('scoreSubtractRule');
    const addVal = addSel.value;
    const subVal = subSel.value;
    if (!addVal && !subVal) {
        alert('Vui lòng chọn một hành vi cộng hoặc trừ điểm.');
        return;
    }
    let points = 0;
    let desc = '';
    if (addVal) {
        const rule = CONFIG.rules.positive.find(r => r.id === addVal);
        if (rule) { points = rule.points;
            desc = 'Cộng điểm: ' + rule.label; }
    }
    if (subVal) {
        const rule = CONFIG.rules.negative.find(r => r.id === subVal);
        if (rule) { points = rule.points;
            desc = (desc ? desc + '; ' : '') + 'Trừ điểm: ' + rule.label; }
    }
    const note = document.getElementById('scoreNote').value.trim();
    const event = {
        id: generateId(),
        studentId: student.id,
        team: appData.teamAssignments[student.id] || 1,
        type: points > 0 ? 'add' : 'subtract',
        points: points,
        description: desc,
        note: note,
        timestamp: new Date().toISOString(),
        actor: 'GVCN',
    };
    appData.events.push(event);
    student.points += points;
    saveData();
    closeScoreModal();
    renderAll();
    alert('✔ Đã ghi nhận ' + (points > 0 ? 'cộng' : 'trừ') + ' ' + Math.abs(points) + ' điểm cho ' + student.name);
});

// ----- Modal xem chi tiết -----
window.openDetailModal = function(studentId) {
    const student = getStudentById(studentId);
    if (!student) return;
    document.getElementById('detailName').textContent = '👤 ' + student.name;
    const badges = getBadges(student);
    const level = getLevel(student.points);
    const team = appData.teamAssignments[student.id] || '?';
    let html = `
        <div><strong>Tổ:</strong> ${team}</div>
        <div><strong>Điểm:</strong> ${student.points}</div>
        <div><strong>Cấp độ:</strong> ${level.icon} ${level.label}</div>
        <div><strong>Huy hiệu:</strong> ${badges.map(b => b.icon+' '+b.label).join(', ') || 'Chưa có'}</div>
        <hr style="margin:12px 0;">
        <div><strong>Lịch sử gần đây:</strong></div>
        <div style="max-height:200px;overflow-y:auto;font-size:0.9rem;">
    `;
    const events = appData.events.filter(e => e.studentId === student.id).sort((a, b) => new Date(b.timestamp) - new Date(a
        .timestamp));
    if (!events.length) html += '<div>Chưa có hoạt động.</div>';
    else {
        events.slice(0, 20).forEach(e => {
            html += `<div style="padding:4px 0;border-bottom:1px solid #eef3ec;">
                ${formatDate(e.timestamp)}: ${e.description} (${e.points>0?'+':''}${e.points}) ${e.note ? '– '+e.note : ''}
            </div>`;
        });
    }
    html += '</div>';
    document.getElementById('detailContent').innerHTML = html;
    document.getElementById('detailModal').classList.add('show');
};

document.getElementById('closeDetailModal').addEventListener('click', function() {
    document.getElementById('detailModal').classList.remove('show');
});
document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('show');
    });
});

// ----- Quản lý tổ -----
window.moveStudentToTeam = function(studentId, newTeam) {
    const student = getStudentById(studentId);
    if (!student) return;
    const oldTeam = appData.teamAssignments[studentId];
    if (oldTeam == newTeam) return;
    const event = {
        id: generateId(),
        studentId: student.id,
        team: newTeam,
        type: 'move',
        points: 0,
        description: `Chuyển từ Tổ ${oldTeam} sang Tổ ${newTeam}`,
        note: '',
        timestamp: new Date().toISOString(),
        actor: 'GVCN',
    };
    appData.events.push(event);
    appData.teamAssignments[studentId] = parseInt(newTeam);
    appData.lastTeamMove = { studentId, oldTeam, newTeam };
    saveData();
    renderAll();
};

document.getElementById('redistributeTeams').addEventListener('click', function() {
    const students = appData.students;
    const numTeams = CONFIG.classInfo.numTeams;
    const shuffled = [...students];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    shuffled.forEach((s, idx) => {
        const team = (idx % numTeams) + 1;
        const oldTeam = appData.teamAssignments[s.id];
        if (oldTeam !== team) {
            const event = {
                id: generateId(),
                studentId: s.id,
                team: team,
                type: 'move',
                points: 0,
                description: `Xếp đều: chuyển từ Tổ ${oldTeam||'?'} sang Tổ ${team}`,
                note: '',
                timestamp: new Date().toISOString(),
                actor: 'GVCN',
            };
            appData.events.push(event);
            appData.teamAssignments[s.id] = team;
        }
    });
    appData.lastTeamMove = null;
    saveData();
    renderAll();
    alert('Đã xếp đều học sinh vào các tổ.');
});

document.getElementById('undoTeamMove').addEventListener('click', function() {
    if (!appData.lastTeamMove) {
        alert('Không có thao tác chuyển tổ nào để hoàn tác.');
        return;
    }
    const { studentId, oldTeam } = appData.lastTeamMove;
    const student = getStudentById(studentId);
    if (!student) { appData.lastTeamMove = null; return; }
    const lastMoveEvent = appData.events.filter(e => e.studentId === studentId && e.type === 'move').pop();
    if (lastMoveEvent) {
        appData.events = appData.events.filter(e => e.id !== lastMoveEvent.id);
    }
    appData.teamAssignments[studentId] = oldTeam;
    appData.lastTeamMove = null;
    saveData();
    renderAll();
    alert('Đã hoàn tác chuyển tổ cho ' + student.name);
});

// ----- Lọc nhật ký -----
document.getElementById('applyLogFilters').addEventListener('click', function() {
    const student = document.getElementById('logFilterStudent').value;
    const team = document.getElementById('logFilterTeam').value;
    const type = document.getElementById('logFilterType').value;
    const dateFrom = document.getElementById('logDateFrom').value;
    const dateTo = document.getElementById('logDateTo').value;
    renderLog({ student, team, type, dateFrom, dateTo });
});

// ----- Hoàn tác sự kiện cuối -----
document.getElementById('undoLastEvent').addEventListener('click', function() {
    if (!appData.events.length) {
        alert('Không có sự kiện nào để hoàn tác.');
        return;
    }
    const lastEvent = appData.events[appData.events.length - 1];
    if (lastEvent.type === 'add' || lastEvent.type === 'subtract') {
        const student = getStudentById(lastEvent.studentId);
        if (student) {
            student.points -= lastEvent.points;
            appData.events.pop();
            saveData();
            renderAll();
            alert('Đã hoàn tác sự kiện: ' + lastEvent.description);
        } else {
            appData.events.pop();
            saveData();
            renderAll();
        }
    } else if (lastEvent.type === 'move') {
        const student = getStudentById(lastEvent.studentId);
        if (student) {
            const match = lastEvent.description.match(/Tổ (\d+) sang Tổ (\d+)/);
            if (match) {
                const oldTeam = parseInt(match[1]);
                appData.teamAssignments[student.id] = oldTeam;
                appData.events.pop();
                saveData();
                renderAll();
                alert('Đã hoàn tác chuyển tổ cho ' + student.name);
                return;
            }
        }
        alert('Không thể hoàn tác sự kiện này.');
    } else {
        alert('Không thể hoàn tác loại sự kiện này.');
    }
});

// ----- Tổng kết -----
function getEventsInRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    return appData.events.filter(e => {
        const d = new Date(e.timestamp);
        return d >= start && d <= end;
    });
}

function generateSummaryText(type, period) {
    let startDate, endDate;
    let label = '';
    if (type === 'week') {
        const weekNum = parseInt(document.getElementById('summaryWeek').value) || 1;
        const start = new Date(CONFIG.classInfo.startDate);
        start.setDate(start.getDate() + (weekNum - 1) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        startDate = start.toISOString().slice(0, 10);
        endDate = end.toISOString().slice(0, 10);
        label = 'Tuần ' + weekNum;
    } else if (type === 'month') {
        const monthVal = document.getElementById('summaryMonth').value;
        if (!monthVal) { alert('Vui lòng chọn tháng.'); return null; }
        const [year, month] = monthVal.split('-').map(Number);
        startDate = new Date(year, month - 1, 1).toISOString().slice(0, 10);
        endDate = new Date(year, month, 0).toISOString().slice(0, 10);
        label = 'Tháng ' + month + '/' + year;
    } else if (type === 'semester') {
        const semId = parseInt(document.getElementById('summarySemester').value);
        const sem = CONFIG.semesters.find(s => s.id === semId);
        if (!sem) { alert('Học kì không hợp lệ.'); return null; }
        const start = new Date(CONFIG.classInfo.startDate);
        start.setDate(start.getDate() + (sem.weekStart - 1) * 7);
        const end = new Date(CONFIG.classInfo.startDate);
        end.setDate(end.getDate() + (sem.weekEnd - 1) * 7 + 6);
        startDate = start.toISOString().slice(0, 10);
        endDate = end.toISOString().slice(0, 10);
        label = sem.name;
    }
    const events = getEventsInRange(startDate, endDate);
    const totalAdd = events.filter(e => e.points > 0).reduce((s, e) => s + e.points, 0);
    const totalSub = events.filter(e => e.points < 0).reduce((s, e) => s + e.points, 0);
    const net = totalAdd + totalSub;
    const studentScores = {};
    events.forEach(e => {
        if (!studentScores[e.studentId]) studentScores[e.studentId] = 0;
        studentScores[e.studentId] += e.points;
    });
    const sorted = Object.entries(studentScores).sort((a, b) => b[1] - a[1]);
    const rankStr = sorted.map(([id, pts], idx) => {
        const s = getStudentById(parseInt(id));
        return `${idx+1}. ${s?s.name:'?'}: ${pts} điểm`;
    }).join('\n');
    const teamScores = {};
    events.forEach(e => {
        if (!teamScores[e.team]) teamScores[e.team] = 0;
        teamScores[e.team] += e.points;
    });
    const teamRank = Object.entries(teamScores).sort((a, b) => b[1] - a[1])
        .map(([t, pts]) => `Tổ ${t}: ${pts} điểm`).join('\n');
    const result = `
📊 TỔNG KẾT ${label.toUpperCase()}
Khoảng thời gian: ${startDate} → ${endDate}
Ngày lập: ${new Date().toLocaleDateString('vi-VN')}
Người thực hiện: GVCN

📌 Thống kê:
- Tổng lượt ghi nhận: ${events.length}
- Tổng điểm cộng: +${totalAdd}
- Tổng điểm trừ: ${totalSub}
- Điểm ròng: ${net}

🏅 Xếp hạng cá nhân:
${rankStr || 'Chưa có dữ liệu'}

🏆 Xếp hạng tổ:
${teamRank || 'Chưa có dữ liệu'}

Nhận xét của giáo viên:
___________________________________
`;
    return { text: result, startDate, endDate, label, events: events.length, totalAdd, totalSub, net };
}

document.getElementById('generateSummary').addEventListener('click', function() {
    const type = document.getElementById('summaryType').value;
    const result = generateSummaryText(type);
    if (!result) return;
    document.getElementById('summaryResult').textContent = result.text;
    window._lastSummary = result;
});

document.getElementById('saveSummary').addEventListener('click', function() {
    if (!window._lastSummary) {
        alert('Hãy tạo tổng kết trước khi lưu.');
        return;
    }
    const summary = {
        id: generateId(),
        ...window._lastSummary,
        savedAt: new Date().toISOString(),
    };
    appData.summaries.push(summary);
    saveData();
    updateSavedSummaries();
    alert('Đã lưu tổng kết.');
});

window.viewSummary = function(idx) {
    const s = appData.summaries[idx];
    if (s) document.getElementById('summaryResult').textContent = s.text;
};

window.deleteSummary = function(idx) {
    if (confirm('Xóa tổng kết này?')) {
        appData.summaries.splice(idx, 1);
        saveData();
        updateSavedSummaries();
        document.getElementById('summaryResult').textContent = 'Đã xóa.';
    }
};

document.getElementById('printSummary').addEventListener('click', function() {
    const content = document.getElementById('summaryResult').textContent;
    if (!content.trim()) { alert('Không có nội dung để in.'); return; }
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write('<html><head><title>Báo cáo tổng kết</title><style>body{font-family:sans-serif;padding:30px;line-height:1.6;}</style></head><body><pre>' +
        content + '</pre></body></html>');
    win.document.close();
    win.print();
});

document.getElementById('deleteSummary').addEventListener('click', function() {
    if (confirm('Xóa toàn bộ tổng kết đã lưu?')) {
        appData.summaries = [];
        saveData();
        updateSavedSummaries();
        document.getElementById('summaryResult').textContent = 'Đã xóa tất cả tổng kết.';
    }
});

// ----- Garden controls -----
document.getElementById('searchStudent').addEventListener('input', renderGarden);
document.getElementById('filterTeam').addEventListener('change', renderGarden);
document.getElementById('sortGarden').addEventListener('change', renderGarden);
document.getElementById('resetGardenFilters').addEventListener('click', function() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('filterTeam').value = 'all';
    document.getElementById('sortGarden').value = 'name';
    renderGarden();
});

// ----- Tabs -----
document.querySelectorAll('#tabNav button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('#tabNav button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        if (tab === 'log') {
            populateLogFilters();
            renderLog({});
        }
        if (tab === 'rankings') renderRankings();
        if (tab === 'teamManage') renderTeamManage();
        if (tab === 'garden') renderGarden();
    });
});

// Sự kiện cho sidebar navigation
document.querySelectorAll('.sidebar-nav button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById('tab-' + tab).classList.add('active');
        // Gọi render tương ứng nếu cần
        if (tab === 'garden') renderGarden();
        if (tab === 'rankings') renderRankings();
        if (tab === 'teamManage') renderTeamManage();
        if (tab === 'log') { populateLogFilters(); renderLog({}); }
        if (tab === 'summary') updateSavedSummaries();
        if (tab === 'rules') renderRules();
    });
});

// Đảm bảo khi load trang, tab garden active
document.addEventListener('DOMContentLoaded', function() {
    // Kích hoạt tab garden mặc định
    document.querySelector('.sidebar-nav button[data-tab="garden"]')?.classList.add('active');
    document.getElementById('tab-garden')?.classList.add('active');
    renderGarden();
});

// ----- Xuất/nhập dữ liệu (gắn vào các nút ở footer, được tạo trong main.js) -----
// Các hàm này sẽ được gọi từ main.js sau khi tạo footer