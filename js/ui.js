// ============================================================
// ui.js – Render giao diện hoàn chỉnh
// ============================================================

import { getState } from './data.js';
import {
    fmtDate, initials, levelOf, todayISO, isoOf, diffDays,
    dateFromISO, currentWeekNumber, weekRange
} from './utils.js';

// Biến toàn cục cho role
export let isTeacher = false;
export function setIsTeacher(val) { isTeacher = val; }

// Toast
export function toast(msg, type = 'info') {
    const wrap = document.getElementById('toast-wrap') || (() => {
        const w = document.createElement('div');
        w.id = 'toast-wrap';
        w.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:340px;';
        document.body.appendChild(w);
        return w;
    })();
    const el = document.createElement('div');
    el.style.cssText = 'background:#243a2e;color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.25);animation:slidein .25s ease;';
    if (type === 'error') el.style.background = '#d9534f';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// Cập nhật UI theo role
export function updateUIByRole() {
    const status = document.getElementById('authStatus');
    if (status) {
        status.textContent = isTeacher ? '👩‍🏫 Giáo viên' : '👨‍🎓 Học sinh (xem)';
        status.className = 'auth-status' + (isTeacher ? ' teacher' : '');
    }
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = isTeacher ? '🔒 Đăng xuất' : '🔑 Đăng nhập GV';
        loginBtn.className = isTeacher ? 'btn' : 'btn btn-primary';
    }
    document.querySelectorAll('.teacher-only').forEach(el => {
        el.style.display = isTeacher ? '' : 'none';
    });
    document.querySelectorAll('.btn-record').forEach(el => {
        if (!isTeacher) el.classList.add('disabled');
        else el.classList.remove('disabled');
    });
}

// --- Hàm tính điểm ---
function studentAttendancePoints(studentId, state) {
    let total = 0;
    Object.keys(state.attendance).forEach(d => {
        const day = state.attendance[d];
        if (!day[studentId]) return;
        const { morning, afternoon } = day[studentId];
        if (morning === 'late') total -= 10;
        else if (morning === 'excused') total -= 10;
        else if (morning === 'absent') total -= 20;
        if (afternoon === 'late') total -= 10;
        else if (afternoon === 'excused') total -= 10;
        else if (afternoon === 'absent') total -= 20;
        if (morning === 'present' && afternoon === 'present') total += 5;
    });
    return total;
}

function studentLogPoints(studentId, state) {
    return state.logs.filter(l => l.studentId === studentId).reduce((a, b) => a + b.points, 0);
}

function studentTotalPoints(studentId, state) {
    return studentLogPoints(studentId, state) + studentAttendancePoints(studentId, state);
}

function rankedStudents(state) {
    return [...state.students].map(s => ({ ...s, pts: studentTotalPoints(s.id, state) }))
        .sort((a, b) => b.pts - a.pts);
}

function rankedGroups(state) {
    const nums = [...new Set(state.students.map(s => s.group))].sort((a, b) => a - b);
    return nums.map(g => ({
        group: g,
        total: state.students.filter(s => s.group === g)
            .reduce((sum, s) => sum + studentTotalPoints(s.id, state), 0),
        count: state.students.filter(s => s.group === g).length
    })).sort((a, b) => b.total - a.total);
}

function groupMembers(state, g) {
    return state.students.filter(s => s.group === g);
}

// --- Các render functions ---

export function renderHeader() {
    const state = getState();
    if (!state) return;
    const c = state.classInfo;
    document.getElementById('hdrClassName').textContent = 'VƯỜN ƯƠM ' + c.className;
    document.getElementById('hdrYear').textContent = 'Năm học ' + c.schoolYear;
    document.getElementById('teacherName').textContent = c.teacher;
    document.getElementById('teacherInitials').textContent = initials(c.teacher).toUpperCase();
}

export function renderSideSummary() {
    const state = getState();
    if (!state) return;
    const wk = currentWeekNumber(state);
    if (wk <= 0) {
        document.getElementById('sideWeekTitle').textContent = 'Thi đua chưa bắt đầu';
        document.getElementById('sideWeekDates').textContent = 'Bắt đầu ngày ' + fmtDate(state.classInfo.week1Start);
        document.getElementById('sideProgressBar').style.width = '0%';
        document.getElementById('sideDayOf').textContent = 'Ngày 0 / 7';
        return;
    }
    const r = weekRange(state, wk);
    const today = new Date();
    let dayOf = diffDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), r.start) + 1;
    dayOf = Math.max(1, Math.min(7, dayOf));
    document.getElementById('sideWeekTitle').textContent = 'Thi đua tuần ' + wk;
    document.getElementById('sideWeekDates').textContent = fmtDate(isoOf(r.start)) + ' – ' + fmtDate(isoOf(r.end));
    document.getElementById('sideProgressBar').style.width = (dayOf / 7 * 100) + '%';
    document.getElementById('sideDayOf').textContent = 'Ngày ' + dayOf + ' / 7';
}

export function renderGardenStats() {
    const state = getState();
    if (!state) return;
    const ranked = rankedStudents(state);
    const total = state.students.length;
    const bloomed = ranked.filter(s => s.pts >= 90).length;
    const totalPts = ranked.reduce((a, s) => a + s.pts, 0);
    document.getElementById('gardenStats').innerHTML = `
        <div class="stat-card"><div class="stat-ic a">🌱</div><div><div class="stat-label">Tổng số học sinh</div><div class="stat-value">${total}</div></div></div>
        <div class="stat-card"><div class="stat-ic b">🌸</div><div><div class="stat-label">Tổng số tổ</div><div class="stat-value">${state.classInfo.numGroups}</div></div></div>
        <div class="stat-card"><div class="stat-ic c">✦</div><div><div class="stat-label">Tổng điểm cả lớp</div><div class="stat-value">${totalPts}</div></div></div>
        <div class="stat-card"><div class="stat-ic d">🏅</div><div><div class="stat-label">HS đạt cấp độ cao</div><div class="stat-value">${bloomed}</div></div></div>
    `;
}

export function renderGarden() {
    const state = getState();
    if (!state) return;
    const q = document.getElementById('gardenSearch').value.trim().toLowerCase();
    const filterGroup = document.getElementById('gardenGroupFilter').value;
    let list = rankedStudents(state);
    if (filterGroup) list = list.filter(s => s.group == filterGroup);
    if (q) list = list.filter(s => s.name.toLowerCase().includes(q));
    const grid = document.getElementById('studentGrid');
    if (list.length === 0) { grid.innerHTML = '<div class="empty">Không tìm thấy học sinh.</div>'; return; }
    grid.innerHTML = list.map((s, i) => {
        const lvl = levelOf(s.pts);
        const pct = lvl.next ? Math.min(100, Math.round((s.pts - (lvl.next - 40)) / 40 * 100)) : 100;
        const toNext = lvl.next ? lvl.next - s.pts : 0;
        return `
        <div class="student-card">
            <div class="rank">#${i+1}</div>
            <div class="seed-emoji">${lvl.emoji}</div>
            <div class="group-badge">Tổ ${s.group}</div>
            <div class="student-name">${s.name}</div>
            <div class="student-sub">Chạm để xem hồ sơ</div>
            <div class="student-points ${s.pts <= 0 ? 'zero' : ''}">${s.pts} <span style="font-size:11px;font-weight:600;color:var(--muted);">điểm</span></div>
            <div class="progress-track"><div class="progress-fill" style="width:${pct}%;"></div></div>
            <div class="progress-caption">${lvl.next ? 'Còn '+toNext+' điểm đến cấp tiếp theo' : 'Đã đạt cấp cao nhất'}</div>
            <button class="btn-record ${isTeacher ? '' : 'disabled'}" onclick="window.openRecord('${s.id}')">+ Ghi nhận điểm</button>
        </div>`;
    }).join('');
    // Click card để mở profile
    document.querySelectorAll('#studentGrid .student-card').forEach((card, idx) => {
        const sid = list[idx].id;
        card.addEventListener('click', (e) => {
            if (e.target.closest('.btn-record')) return;
            openProfile(sid);
        });
        card.style.cursor = 'pointer';
    });
}

export function renderStudents() {
    const state = getState();
    if (!state) return;
    const body = document.getElementById('studentsTableBody');
    body.innerHTML = state.students.map((s, i) => `
        <tr>
            <td>${i+1}</td>
            <td><b>${s.name}</b></td>
            <td>
                <select ${isTeacher ? '' : 'disabled'} onchange="window.changeGroup('${s.id}', this.value)" style="border:1px solid var(--border);border-radius:8px;padding:5px 8px;font-size:12.5px;">
                    ${Array.from({length: state.classInfo.numGroups}, (_, g) => g+1).map(g => `<option value="${g}" ${g == s.group ? 'selected' : ''}>Tổ ${g}</option>`).join('')}
                </select>
            </td>
            <td>${fmtDate(s.joinDate)}</td>
            <td>
                ${isTeacher ? `<button class="btn btn-sm btn-danger" onclick="if(confirm('Xóa học sinh này?')) window.removeStudent('${s.id}')">Xoá</button>` : ''}
            </td>
        </tr>
    `).join('');
    const groups = [...new Set(state.students.map(s => s.group))].sort((a,b) => a-b);
    document.getElementById('groupCountGrid').innerHTML = groups.map(g => {
        const mem = groupMembers(state, g);
        const total = mem.reduce((sum, s) => sum + studentTotalPoints(s.id, state), 0);
        return `<div class="rank-card"><div class="rank-group">Tổ ${g}</div><div class="rank-points">${mem.length}</div><div class="rank-meta">thành viên · ${total} điểm</div></div>`;
    }).join('');
}

export function renderOfficers() {
    const state = getState();
    if (!state) return;
    const body = document.getElementById('officersTableBody');
    body.innerHTML = state.officers.map(o => `
        <tr>
            <td><b>${o.role}</b></td>
            <td>
                <select ${isTeacher ? '' : 'disabled'} onchange="window.setOfficer('${o.id}', this.value)" style="border:1px solid var(--border);border-radius:8px;padding:5px 8px;font-size:12.5px;min-width:200px;">
                    <option value="">— Chưa phân công —</option>
                    ${state.students.map(s => `<option value="${s.id}" ${s.id === o.studentId ? 'selected' : ''}>${s.name} (Tổ ${s.group})</option>`).join('')}
                </select>
            </td>
            <td class="hint">Hoàn thành: +20 điểm · Sai: −40 điểm</td>
            <td class="teacher-only" style="display:none;">${isTeacher ? `<button class="btn btn-sm btn-danger" onclick="window.removeOfficerRole('${o.id}')">Xoá</button>` : ''}</td>
        </tr>
    `).join('') || '<tr><td colspan="4" class="empty">Chưa có chức vụ.</td></tr>';
}

export function renderAttendance() {
    const state = getState();
    if (!state) return;
    const dateInput = document.getElementById('attDate');
    if (!dateInput.value) dateInput.value = todayISO();
    const dateStr = dateInput.value;
    if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
    state.students.forEach(s => {
        if (!state.attendance[dateStr][s.id]) state.attendance[dateStr][s.id] = { morning: '', afternoon: '', morningNote: '', afternoonNote: '' };
    });
    const day = state.attendance[dateStr];
    let sangCoMat = 0, sangTreVang = 0, chieuCoMat = 0, chieuTreVang = 0;
    state.students.forEach(s => {
        const m = day[s.id].morning;
        const a = day[s.id].afternoon;
        if (m === 'present') sangCoMat++; else if (m) sangTreVang++;
        if (a === 'present') chieuCoMat++; else if (a) chieuTreVang++;
    });
    sangTreVang = state.students.length - sangCoMat;
    chieuTreVang = state.students.length - chieuCoMat;

    document.getElementById('attStats').innerHTML = `
        <div class="stat-card"><div class="stat-ic a">👥</div><div><div class="stat-label">Sĩ số</div><div class="stat-value">${state.students.length}</div></div></div>
        <div class="stat-card"><div class="stat-ic a">☀️</div><div><div class="stat-label">Sáng có mặt</div><div class="stat-value">${sangCoMat}</div></div></div>
        <div class="stat-card"><div class="stat-ic b">☀️</div><div><div class="stat-label">Sáng trễ/vắng</div><div class="stat-value">${sangTreVang}</div></div></div>
        <div class="stat-card"><div class="stat-ic c">🌙</div><div><div class="stat-label">Chiều có mặt</div><div class="stat-value">${chieuCoMat}</div></div></div>
        <div class="stat-card"><div class="stat-ic d">🌙</div><div><div class="stat-label">Chiều trễ/vắng</div><div class="stat-value">${chieuTreVang}</div></div></div>
    `;
    const statusMap = { present: '✓ Có mặt', late: '⏱ Đi trễ', excused: '○ Vắng CP', absent: '! Vắng KP', '': '—' };
    const listEl = document.getElementById('attList');
    listEl.innerHTML = state.students.map((s, i) => {
        const rec = day[s.id];
        const morningVal = rec.morning || '';
        const afternoonVal = rec.afternoon || '';
        const morningBtns = ['present','late','excused','absent'].map(v =>
            `<button class="att-btn ${v} ${morningVal === v ? 'on' : ''}" ${isTeacher ? `onclick="window.setAtt('${dateStr}','${s.id}','morning','${v}')"` : 'disabled'} style="${!isTeacher ? 'opacity:0.6;cursor:not-allowed;' : ''}">${statusMap[v]}</button>`
        ).join('');
        const afternoonBtns = ['present','late','excused','absent'].map(v =>
            `<button class="att-btn ${v} ${afternoonVal === v ? 'on' : ''}" ${isTeacher ? `onclick="window.setAtt('${dateStr}','${s.id}','afternoon','${v}')"` : 'disabled'} style="${!isTeacher ? 'opacity:0.6;cursor:not-allowed;' : ''}">${statusMap[v]}</button>`
        ).join('');
        return `<div class="att-row">
            <div>
                <div class="att-name">${i+1}. ${s.name} · Tổ ${s.group}</div>
                <div class="att-label">☀️ Buổi sáng</div>
                <div class="att-buttons">${morningBtns}</div>
                <input class="att-note" placeholder="Ghi chú..." value="${rec.morningNote||''}" ${isTeacher ? `onchange="window.setAttNote('${dateStr}','${s.id}','morningNote', this.value)"` : 'disabled'} style="${!isTeacher ? 'opacity:0.6;' : ''}">
            </div>
            <div>
                <div class="att-label">🌙 Buổi chiều</div>
                <div class="att-buttons">${afternoonBtns}</div>
                <input class="att-note" placeholder="Ghi chú..." value="${rec.afternoonNote||''}" ${isTeacher ? `onchange="window.setAttNote('${dateStr}','${s.id}','afternoonNote', this.value)"` : 'disabled'} style="${!isTeacher ? 'opacity:0.6;' : ''}">
            </div>
        </div>`;
    }).join('');
}

export function renderRanking() {
    const state = getState();
    if (!state) return;
    const rg = rankedGroups(state);
    const medals = ['🥇','🥈','🥉','🌿'];
    document.getElementById('rankGroupGrid').innerHTML = rg.map((g, i) => {
        const avg = g.count ? Math.round(g.total / g.count) : 0;
        return `<div class="rank-card ${i===0?'first':''}">
            <div class="medal">${medals[i]||'🌿'}</div>
            <div class="rank-group">Tổ ${g.group}</div>
            <div class="rank-points">${g.total} điểm</div>
            <div class="rank-meta">${g.count} thành viên · TB ${avg} điểm</div>
            <div class="progress-track"><div class="progress-fill" style="width:${rg[0].total ? Math.round(g.total/rg[0].total*100) : 0}%;"></div></div>
        </div>`;
    }).join('');
    const rs = rankedStudents(state).slice(0,10);
    document.getElementById('rankStudentList').innerHTML = rs.map((s, i) => `
        <div class="list-row">
            <div class="list-left"><span class="list-num">${i+1}</span> ${levelOf(s.pts).emoji} <b>${s.name}</b></div>
            <div style="display:flex;align-items:center;gap:16px;">
                <span class="hint" style="margin:0;">Tổ ${s.group}</span>
                <b style="color:${s.pts > 0 ? 'var(--primary-dark)' : 'var(--text)'}">${s.pts} điểm</b>
            </div>
        </div>
    `).join('') || '<div class="empty">Chưa có dữ liệu.</div>';
}

export function renderRules() {
    const state = getState();
    if (!state) return;
    const groups = [
        { key: 'study', title: '✅ Điểm cộng từ kết quả học tập', cls: 'pos' },
        { key: 'class', title: '✋ Điểm cộng trong giờ học', cls: 'pos' },
        { key: 'special', title: '🌟 Điểm cộng đặc biệt', cls: 'pos' },
        { key: 'deduct', title: '⚠ Điểm trừ – nhắc nhở', cls: 'deduct' }
    ];
    const container = document.getElementById('rulesContainer');
    container.innerHTML = groups.map(g => {
        const rules = state.rules.filter(r => r.group === g.key);
        return `<div class="rule-group-title"><span class="cb">✓</span> ${g.title}</div>
            <div class="rule-grid">${rules.map(r => `
                <div class="rule-card ${g.cls}">
                    <div class="rule-left">
                        <div class="rule-ic">${r.icon}</div>
                        <div>
                            <div class="rule-text">${r.text}</div>
                            <div class="rule-desc">${r.desc || ''}</div>
                            ${isTeacher ? `<div class="rule-btns" style="margin-top:8px;">
                                <button class="btn btn-sm" onclick="window.openRuleModal('${r.id}')">Sửa</button>
                                <button class="btn btn-sm btn-danger" onclick="window.deleteRule('${r.id}')">Xoá</button>
                            </div>` : ''}
                        </div>
                    </div>
                    <div class="rule-actions"><div class="rule-points ${r.points < 0 ? 'neg' : 'pos'}">${r.teacherInput ? 'GV tự nhập' : (r.points > 0 ? '+' : '') + r.points}</div></div>
                </div>`).join('') || '<div class="empty">Chưa có quy định.</div>'}
            </div>`;
    }).join('');
}

export function renderLog() {
    const state = getState();
    if (!state) return;
    const items = [...state.logs].sort((a,b) => (b.timestamp||0) - (a.timestamp||0));
    document.getElementById('logList').innerHTML = items.map(l => {
        const s = state.students.find(x => x.id === l.studentId);
        return `<div class="log-item">
            <div class="log-dot ${l.points < 0 ? 'neg' : ''}"></div>
            <div class="log-main">
                <b>${s ? s.name : '—'}</b> — ${l.ruleText || l.content} <b style="color:${l.points < 0 ? 'var(--red)' : 'var(--primary-dark)'}">${l.points > 0 ? '+' : ''}${l.points}</b>
                <div class="log-time">${fmtDate(l.date)}</div>
            </div>
        </div>`;
    }).join('') || '<div class="empty">Chưa có hoạt động.</div>';
}

export function renderSummary() {
    const state = getState();
    if (!state) return;
    const wk = currentWeekNumber(state);
    document.getElementById('summaryCurrentWeek').textContent = 'Tuần ' + (wk || '—');
    document.getElementById('summaryToday').textContent = fmtDate(todayISO());
    document.getElementById('summaryWeekInfo').textContent = 'Tuần 1: ' + fmtDate(state.classInfo.week1Start) + ' · Tuần 2: ' + fmtDate(state.classInfo.week2Start);

    const sel = document.getElementById('summaryWeekSelect');
    const totalWeeks = state.classInfo.totalWeeks || 38;
    let opts = '';
    for (let i = 1; i <= totalWeeks; i++) {
        const r = weekRange(state, i);
        if (r.start && r.end) {
            opts += `<option value="${i}" ${i === wk ? 'selected' : ''}>Tuần ${i} - ${fmtDate(isoOf(r.start))} – ${fmtDate(isoOf(r.end))}</option>`;
        }
    }
    sel.innerHTML = opts || '<option value="">Chưa có dữ liệu</option>';

    const chosenWk = parseInt(sel.value) || wk || 1;
    const range = weekRange(state, chosenWk);
    const fromISO = isoOf(range.start);
    const toISO = isoOf(range.end);
    const logs = state.logs.filter(l => l.date >= fromISO && l.date <= toISO);
    const plus = logs.filter(l => l.points > 0).reduce((a,b) => a + b.points, 0);
    const minus = logs.filter(l => l.points < 0).reduce((a,b) => a + b.points, 0);
    const net = plus + minus;
    document.getElementById('summaryStats').innerHTML = `
        <div class="stat-card"><div class="stat-ic a">📝</div><div><div class="stat-label">Lượt ghi nhận</div><div class="stat-value">${logs.length}</div></div></div>
        <div class="stat-card"><div class="stat-ic a">＋</div><div><div class="stat-label">Điểm cộng</div><div class="stat-value" style="color:var(--primary-dark)">+${plus}</div></div></div>
        <div class="stat-card"><div class="stat-ic d">－</div><div><div class="stat-label">Điểm trừ</div><div class="stat-value" style="color:var(--red)">${minus}</div></div></div>
        <div class="stat-card"><div class="stat-ic c">Σ</div><div><div class="stat-label">Điểm ròng</div><div class="stat-value">${net}</div></div></div>
    `;

    const perStudent = state.students.map(s => {
        const pts = logs.filter(l => l.studentId === s.id).reduce((a,b) => a + b.points, 0);
        return { ...s, pts };
    }).sort((a,b) => b.pts - a.pts);
    const hasData = perStudent.some(s => s.pts !== 0);
    document.getElementById('summaryStudentRank').innerHTML = hasData ? perStudent.slice(0,10).map((s, i) =>
        `<div class="list-row"><div class="list-left"><span class="list-num">${i+1}</span><b>${s.name}</b></div><b>${s.pts} điểm</b></div>`
    ).join('') : '<div class="empty">Chưa có dữ liệu điểm trong khoảng thời gian này.</div>';

    const groups = [...new Set(state.students.map(s => s.group))].sort((a,b) => a-b);
    const groupTotals = groups.map(g => ({
        group: g,
        total: state.students.filter(s => s.group === g)
            .reduce((sum, s) => sum + (perStudent.find(x => x.id === s.id)?.pts || 0), 0)
    })).sort((a,b) => b.total - a.total);
    document.getElementById('summaryGroupRank').innerHTML = groupTotals.map((gt, i) =>
        `<div class="list-row"><div class="list-left"><span class="list-num">${i+1}</span>Tổ ${gt.group}</div><b>${gt.total}</b></div>`
    ).join('') || '<div class="empty">Chưa có dữ liệu.</div>';
}

export function renderSettings() {
    const state = getState();
    if (!state) return;
    const c = state.classInfo;
    document.getElementById('setSchool').value = c.school || '';
    document.getElementById('setClassName').value = c.className || '';
    document.getElementById('setTeacher').value = c.teacher || '';
    document.getElementById('setYear').value = c.schoolYear || '';
    document.getElementById('setWeek1').value = c.week1Start || '';
    document.getElementById('setWeek2').value = c.week2Start || '';
    document.getElementById('setTotalWeeks').value = c.totalWeeks || '';
    document.getElementById('setHk1Weeks').value = c.hk1Weeks || '';
    document.getElementById('setNumGroups').value = c.numGroups || '';
    document.getElementById('quickList').value = state.students.map(s => s.name).join('\n');
}

// Render tổng hợp
export function renderAll() {
    console.log('Render all...');
    const state = getState();
    if (!state) {
        console.warn('State chưa có dữ liệu!');
        return;
    }
    renderHeader();
    renderSideSummary();
    renderGardenStats();
    renderGarden();
    renderStudents();
    renderOfficers();
    renderAttendance();
    renderRanking();
    renderRules();
    renderLog();
    renderSummary();
    renderSettings();
    updateUIByRole();
    console.log('Render hoàn tất');
}

// --- Modal functions ---
let recordStudentId = null;
export function openRecord(sid) {
    if (!isTeacher) { toast('⚠️ Vui lòng đăng nhập với quyền giáo viên.'); return; }
    // sid được gọi từ onclick="window.openRecord('${s.id}')" nên LUÔN là chuỗi (string),
    // trong khi id học sinh lấy từ Supabase là số (number). So sánh "===" trước đây luôn
    // sai kiểu dữ liệu -> không tìm thấy học sinh -> lỗi ngầm -> modal không hiện ra được.
    // Ép kiểu về số để so sánh chính xác.
    const id = typeof sid === 'string' ? parseInt(sid, 10) : sid;
    const state = getState();
    const s = state.students.find(x => x.id === id);
    if (!s) { toast('⚠️ Không tìm thấy học sinh!'); return; }
    recordStudentId = id;
    document.getElementById('recordName').textContent = s.name;
    const sel = document.getElementById('recordRuleSelect');
    sel.innerHTML = state.rules.map(r => `<option value="${r.id}">${r.text} (${r.teacherInput ? 'GV tự nhập' : (r.points > 0 ? '+' : '') + r.points})</option>`).join('');
    toggleCustomWrap();
    document.getElementById('recordCustomPoints').value = 1;
    document.getElementById('recordOverlay').classList.add('show');
    window.recordStudentId = id;
}
export function closeRecord() { document.getElementById('recordOverlay').classList.remove('show'); }

export function toggleCustomWrap() {
    const rid = document.getElementById('recordRuleSelect').value;
    const state = getState();
    const r = state.rules.find(x => x.id == rid);
    document.getElementById('recordCustomWrap').style.display = (r && r.teacherInput) ? 'flex' : 'none';
}

let profileStudentId = null;
export function openProfile(sid) {
    const state = getState();
    const s = state.students.find(x => x.id === sid);
    if (!s) return;
    profileStudentId = sid;
    const pts = studentTotalPoints(sid, state);
    const lvl = levelOf(pts);
    document.getElementById('profileName').textContent = s.name;
    document.getElementById('profileGroup').textContent = 'Tổ '+s.group;
    document.getElementById('profileLevel').textContent = lvl.emoji + ' ' + lvl.name;
    const logs = state.logs.filter(l => l.studentId === sid && l.date >= state.classInfo.week1Start);
    const plus = logs.filter(l => l.points > 0).reduce((a,b) => a+b.points, 0);
    const minus = logs.filter(l => l.points < 0).reduce((a,b) => a+b.points, 0);
    const attDates = Object.keys(state.attendance).filter(d => d >= state.classInfo.week1Start);
    let present = 0;
    attDates.forEach(d => {
        const r = state.attendance[d][sid];
        if (r && r.morning === 'present' && r.afternoon === 'present') present++;
    });
    const rank = rankedStudents(state).findIndex(x => x.id === sid) + 1;
    document.getElementById('pStatPlus').textContent = '+' + plus;
    document.getElementById('pStatMinus').textContent = minus;
    document.getElementById('pStatNet').textContent = plus + minus;
    document.getElementById('pStatAtt').textContent = present + '/' + attDates.length;
    document.getElementById('pStatRank').textContent = '#' + rank + '/' + state.students.length;
    document.getElementById('profilePlusList').innerHTML = plus ? logs.filter(l => l.points > 0).map(l => `<div class="list-row"><span>${l.ruleText}</span><b style="color:var(--primary-dark)">+${l.points}</b></div>`).join('') : '<div class="empty">Không có</div>';
    document.getElementById('profileMinusList').innerHTML = minus ? logs.filter(l => l.points < 0).map(l => `<div class="list-row"><span>${l.ruleText}</span><b style="color:var(--red)">${l.points}</b></div>`).join('') : '<div class="empty">Không có</div>';
    const attRows = attDates.sort().map(d => {
        const r = state.attendance[d][sid];
        const label = v => v === 'present' ? '✅ Có mặt' : v === 'late' ? '⏰ Đi trễ' : v === 'excused' ? '📝 Vắng CP' : v === 'absent' ? '❌ Vắng KP' : '—';
        return `<tr><td>${fmtDate(d)}</td><td>${label(r ? r.morning : '')}</td><td>${label(r ? r.afternoon : '')}</td></tr>`;
    }).join('');
    document.getElementById('profileAttTable').innerHTML = attRows || '<tr><td colspan="3" class="empty">Chưa có dữ liệu</td></tr>';
    document.getElementById('profileOverlay').classList.add('show');
}
export function closeProfile() { document.getElementById('profileOverlay').classList.remove('show'); }

let editingRuleId = null;
export function openRuleModal(id) {
    if (!isTeacher) return;
    editingRuleId = id || null;
    const state = getState();
    const r = id ? state.rules.find(x => x.id == id) : null;
    document.getElementById('ruleModalTitle').textContent = id ? 'Sửa quy định' : 'Thêm quy định mới';
    document.getElementById('ruleIcon').value = r ? r.icon : '⭐';
    document.getElementById('ruleGroupSel').value = r ? r.group : 'study';
    document.getElementById('ruleContent').value = r ? r.text : '';
    document.getElementById('rulePoints').value = r ? r.points : 1;
    document.getElementById('ruleTeacherInput').checked = r ? r.teacherInput : false;
    document.getElementById('ruleDesc').value = r ? r.desc : '';
    document.getElementById('ruleOverlay').classList.add('show');
    window.editingRuleId = editingRuleId;
}
export function closeRuleModal() { document.getElementById('ruleOverlay').classList.remove('show'); }

export function openStudentModal() {
    const state = getState();
    const n = state.classInfo.numGroups || 4;
    document.getElementById('newStudentGroup').innerHTML = Array.from({length:n}, (_,i) => i+1).map(g => `<option value="${g}">Tổ ${g}</option>`).join('');
    document.getElementById('newStudentName').value = '';
    document.getElementById('studentOverlay').classList.add('show');
}
export function closeStudentModal() { document.getElementById('studentOverlay').classList.remove('show'); }

export function openOfficerRoleModal() {
    document.getElementById('newOfficerRole').value = '';
    document.getElementById('officerRoleOverlay').classList.add('show');
}
export function closeOfficerRoleModal() { document.getElementById('officerRoleOverlay').classList.remove('show'); }

// Xuất biến để main.js có thể tham chiếu
export { recordStudentId, editingRuleId };