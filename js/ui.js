// ============================================================
// FILE: ui.js
// Các hàm render giao diện: stats, garden, rankings, log, team manage, rules, ...
// ============================================================

function renderStats() {
    const total = appData.students.length;
    document.getElementById('totalStudents').textContent = total;
    document.getElementById('totalTeams').textContent = CONFIG.classInfo.numTeams;
    const totalPts = appData.students.reduce((s, st) => s + st.points, 0);
    document.getElementById('totalPoints').textContent = totalPts;
    const highLevel = appData.students.filter(s => getLevel(s.points).minPoints >= 100).length;
    document.getElementById('highLevelCount').textContent = highLevel;
    let top = null,
        topPts = -Infinity;
    appData.students.forEach(s => { if (s.points > topPts) { topPts = s.points;
            top = s; } });
    document.getElementById('topStudent').textContent = top ? top.name : '--';
    let bestTeam = null,
        bestAvg = -Infinity;
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        const avg = getTeamAvg(t);
        if (avg > bestAvg) { bestAvg = avg;
            bestTeam = t; }
    }
    document.getElementById('topTeam').textContent = bestTeam ? 'Tổ ' + bestTeam : '--';
    const wk = getCurrentWeek();
    document.getElementById('currentWeekDisplay').textContent = wk > 0 ? 'Tuần ' + wk : 'Chưa bắt đầu';
}

function renderTeamFilter() {
    const sel = document.getElementById('filterTeam');
    const current = sel.value;
    sel.innerHTML = '<option value="all">Tất cả tổ</option>';
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = 'Tổ ' + t;
        sel.appendChild(opt);
    }
    sel.value = current;
}

function renderGarden() {
    const grid = document.getElementById('gardenGrid');
    const search = document.getElementById('searchStudent').value.toLowerCase().trim();
    const teamFilter = document.getElementById('filterTeam').value;
    const sort = document.getElementById('sortGarden').value;

    let list = appData.students.filter(s => {
        const matchName = s.name.toLowerCase().includes(search);
        const matchTeam = teamFilter === 'all' || appData.teamAssignments[s.id] == teamFilter;
        return matchName && matchTeam;
    });

    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'points-desc') list.sort((a, b) => b.points - a.points);
    else if (sort === 'points-asc') list.sort((a, b) => a.points - b.points);
    else if (sort === 'team') list.sort((a, b) => (appData.teamAssignments[a.id] || 0) - (appData.teamAssignments[b.id] || 0));

    if (!list.length) {
        grid.innerHTML = '<div class="empty-message">Không có học sinh nào phù hợp.</div>';
        return;
    }

    let html = '';
    list.forEach(s => {
        const team = appData.teamAssignments[s.id] || '?';
        const level = getLevel(s.points);
        const badges = getBadges(s);
        const badgeStr = badges.map(b => b.icon).join(' ');
        html += `
            <div class="student-card">
                <div class="tree-icon">${level.icon}</div>
                <div class="name">${s.name}</div>
                <div class="team-tag">Tổ ${team}</div>
                <div class="points">${s.points} điểm</div>
                <div class="level-label" style="background:${level.color}30; color:${level.color};">
                    ${level.label}
                </div>
                <div class="badges">${badgeStr || '📌'}</div>
                <div class="actions">
                    <button class="secondary" onclick="openScoreModal(${s.id})">➕ Điểm</button>
                    <button class="secondary" onclick="openDetailModal(${s.id})">👁</button>
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;
}

function renderRankings() {
    // Cá nhân
    const sorted = [...appData.students].sort((a, b) => b.points - a.points);
    let htmlInd = '<table><tr><th>#</th><th>Họ tên</th><th>Tổ</th><th>Điểm</th><th>Cấp độ</th><th>Huy hiệu</th></tr>';
    if (!sorted.length) htmlInd += '<tr><td colspan="6">Chưa có dữ liệu</td></tr>';
    else {
        sorted.forEach((s, idx) => {
            const rank = idx + 1;
            const badgeStr = getBadges(s).map(b => b.icon).join(' ');
            const level = getLevel(s.points);
            const cls = rank <= 3 ? 'rank-badge rank-' + rank : 'rank-badge';
            htmlInd += `<tr>
                <td><span class="${cls}">${rank}</span></td>
                <td>${s.name}</td>
                <td>Tổ ${appData.teamAssignments[s.id]||'?'}</td>
                <td><strong>${s.points}</strong></td>
                <td>${level.icon} ${level.label}</td>
                <td>${badgeStr || '–'}</td>
            </tr>`;
        });
    }
    htmlInd += '</table>';
    document.getElementById('individualRankingTable').innerHTML = htmlInd;

    // Tổ
    let htmlTeam = '<table><tr><th>#</th><th>Tổ</th><th>Sĩ số</th><th>Tổng điểm</th><th>Trung bình</th><th>Thành viên nổi bật</th></tr>';
    const teams = [];
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        const members = getTeamStudents(t);
        const pts = getTeamPoints(t);
        const avg = members.length ? pts / members.length : 0;
        teams.push({ id: t, members, pts, avg });
    }
    teams.sort((a, b) => b.avg - a.avg);
    if (!teams.length) htmlTeam += '<tr><td colspan="6">Chưa có tổ</td></tr>';
    else {
        teams.forEach((t, idx) => {
            const rank = idx + 1;
            const cls = rank <= 3 ? 'rank-badge rank-' + rank : 'rank-badge';
            let best = null,
                bestPts = -Infinity;
            t.members.forEach(m => { if (m.points > bestPts) { bestPts = m.points;
                    best = m; } });
            htmlTeam += `<tr>
                <td><span class="${cls}">${rank}</span></td>
                <td>Tổ ${t.id}</td>
                <td>${t.members.length}</td>
                <td>${t.pts}</td>
                <td>${t.avg.toFixed(1)}</td>
                <td>${best ? best.name + ' ('+best.points+')' : '–'}</td>
            </tr>`;
        });
    }
    htmlTeam += '</table>';
    document.getElementById('teamRankingTable').innerHTML = htmlTeam;
}

function renderLog(filters = {}) {
    const list = document.getElementById('logList');
    let events = [...appData.events];
    if (filters.student && filters.student !== 'all') {
        events = events.filter(e => e.studentId == filters.student);
    }
    if (filters.team && filters.team !== 'all') {
        events = events.filter(e => e.team == filters.team);
    }
    if (filters.type && filters.type !== 'all') {
        events = events.filter(e => e.type === filters.type);
    }
    if (filters.dateFrom) {
        const from = new Date(filters.dateFrom);
        events = events.filter(e => new Date(e.timestamp) >= from);
    }
    if (filters.dateTo) {
        const to = new Date(filters.dateTo);
        to.setHours(23, 59, 59);
        events = events.filter(e => new Date(e.timestamp) <= to);
    }
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (!events.length) {
        list.innerHTML = '<div style="padding:12px;text-align:center;color:#6f8f7a;">Chưa có hoạt động.</div>';
        return;
    }
    let html = '';
    events.forEach(e => {
        const student = getStudentById(e.studentId);
        const name = student ? student.name : '?';
        const ptsClass = e.points > 0 ? 'positive' : (e.points < 0 ? 'negative' : '');
        const typeLabel = { add: '➕ Cộng', subtract: '➖ Trừ', move: '🔄 Chuyển tổ' } [e.type] || e.type;
        html += `<div class="log-item">
            <span class="log-time">${formatDate(e.timestamp)}</span>
            <span class="log-desc"><strong>${name}</strong> (Tổ ${e.team||'?'}) ${e.description} ${e.note ? ' – '+e.note : ''}</span>
            <span class="log-points ${ptsClass}">${e.points > 0 ? '+'+e.points : e.points}</span>
            <span style="font-size:0.7rem;opacity:0.6;">${typeLabel}</span>
        </div>`;
    });
    list.innerHTML = html;
}

function renderTeamManage() {
    const container = document.getElementById('teamManageList');
    let html = '';
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        const members = getTeamStudents(t);
        html += `<div style="margin-bottom:16px;background:#f5faf3;border-radius:16px;padding:12px;">
            <h4 style="color:#1e5a3a;">Tổ ${t} (${members.length} HS)</h4>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${members.map(s => `
                    <span style="background:white;border-radius:30px;padding:2px 12px;border:1px solid #dce8d6;display:inline-flex;align-items:center;gap:6px;">
                        ${s.name}
                        <select onchange="moveStudentToTeam(${s.id}, this.value)" style="width:auto;padding:0 4px;font-size:0.8rem;border-radius:12px;background:#eef3ec;">
                            ${Array.from({length: CONFIG.classInfo.numTeams}, (_, i) => i+1).map(num => 
                                `<option value="${num}" ${num===t?'selected':''}>Tổ ${num}</option>`
                            ).join('')}
                        </select>
                    </span>
                `).join('')}
                ${!members.length ? '<span style="color:#6f8f7a;">(trống)</span>' : ''}
            </div>
        </div>`;
    }
    container.innerHTML = html;
    const sizes = [];
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        sizes.push('T' + t + ': ' + getTeamStudents(t).length);
    }
    document.getElementById('teamSizes').textContent = sizes.join(' | ');
}

function renderRules() {
    const container = document.getElementById('rulesDisplay');
    let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">';
    html += `<div><h4 style="color:#1e7a4b;">✅ Cộng điểm</h4>`;
    CONFIG.rules.positive.forEach(r => {
        html += `<div class="rule-item"><span>${r.label}</span><span class="pts positive">+${r.points}</span></div>`;
    });
    html += '</div>';
    html += `<div><h4 style="color:#b33c3c;">❌ Trừ điểm</h4>`;
    CONFIG.rules.negative.forEach(r => {
        html += `<div class="rule-item"><span>${r.label}</span><span class="pts negative">${r.points}</span></div>`;
    });
    html += '</div></div>';
    container.innerHTML = html;
}

function populateLogFilters() {
    const selSt = document.getElementById('logFilterStudent');
    const currentVal = selSt.value;
    selSt.innerHTML = '<option value="all">Tất cả HS</option>';
    appData.students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        selSt.appendChild(opt);
    });
    selSt.value = currentVal;

    const selTeam = document.getElementById('logFilterTeam');
    const curTeam = selTeam.value;
    selTeam.innerHTML = '<option value="all">Tất cả tổ</option>';
    for (let t = 1; t <= CONFIG.classInfo.numTeams; t++) {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = 'Tổ ' + t;
        selTeam.appendChild(opt);
    }
    selTeam.value = curTeam;
}

function updateSavedSummaries() {
    const container = document.getElementById('savedSummariesList');
    if (!appData.summaries.length) {
        container.textContent = '(chưa có)';
        return;
    }
    container.innerHTML = appData.summaries.map((s, idx) =>
        `<span style="background:#eef3ec;padding:2px 12px;border-radius:30px;margin:4px;display:inline-block;">
            ${s.label} (${s.startDate}→${s.endDate})
            <button onclick="viewSummary(${idx})" style="background:transparent;color:#1e5a3a;padding:0 4px;">👁</button>
            <button onclick="deleteSummary(${idx})" style="background:transparent;color:#b33c3c;padding:0 4px;">✖</button>
        </span>`
    ).join(' ');
}

function renderAll() {
    renderStats();
    renderTeamFilter();
    renderGarden();
    renderRankings();
    populateLogFilters();
    renderLog({});
    renderTeamManage();
    renderRules();
    updateSavedSummaries();
}