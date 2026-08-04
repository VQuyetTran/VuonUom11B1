function renderAll() {
    renderStats();
    renderGarden();
    renderGroupMgmt();
    renderLeaderboards();
    renderRulesTab();
    renderLogs();
}

function renderStats() {
    document.getElementById("st-total-students").innerText = appData.students.length;
    document.getElementById("st-total-groups").innerText = classInfo.totalGroups;
    const totalScore = appData.students.reduce((acc, curr) => acc + curr.score, 0);
    document.getElementById("st-class-points").innerText = totalScore;
    document.getElementById("st-current-week").innerText = getCurrentWeek();

    const top = [...appData.students].sort((a,b) => b.score - a.score)[0];
    document.getElementById("st-top-student").innerText = top ? formatStudentName(top.name) : "-";
}

function renderGarden() {
    const grid = document.getElementById("student-grid");
    grid.innerHTML = "";

    const searchVal = document.getElementById("search-input").value.toLowerCase();
    const filterGroup = document.getElementById("filter-group").value;
    const sortOrder = document.getElementById("sort-order").value;

    let filtered = appData.students.filter(s => {
        const matchName = s.name.toLowerCase().includes(searchVal);
        const matchGroup = filterGroup === "all" || s.group.toString() === filterGroup;
        return matchName && matchGroup;
    });

    if (sortOrder === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } else if (sortOrder === "score-desc") {
        filtered.sort((a, b) => b.score - a.score);
    } else if (sortOrder === "score-asc") {
        filtered.sort((a, b) => a.score - b.score);
    } else if (sortOrder === "group") {
        filtered.sort((a, b) => a.group - b.group);
    }

    filtered.forEach(s => {
        const level = getTreeLevel(s.score);
        const card = document.createElement("div");
        card.className = "student-card";
        card.innerHTML = `
            <div class="tree-icon">${level.icon}</div>
            <div class="student-name">${formatStudentName(s.name)}</div>
            <div class="student-info">Tổ ${s.group} | Cấp: ${level.title}</div>
            <div class="student-score">${s.score} điểm</div>
            <div class="card-actions">
                <button class="btn btn-primary" onclick="openScoreModal(${s.id})">+ Ghi điểm</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderGroupMgmt() {
    const tbody = document.getElementById("group-mgmt-table");
    tbody.innerHTML = "";
    appData.students.forEach((s, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>${formatStudentName(s.name)}</td>
                <td>Tổ ${s.group}</td>
                <td>
                    <select onchange="changeGroup(${s.id}, this.value)">
                        <option value="1" ${s.group === 1 ? 'selected' : ''}>Tổ 1</option>
                        <option value="2" ${s.group === 2 ? 'selected' : ''}>Tổ 2</option>
                        <option value="3" ${s.group === 3 ? 'selected' : ''}>Tổ 3</option>
                        <option value="4" ${s.group === 4 ? 'selected' : ''}>Tổ 4</option>
                    </select>
                </td>
            </tr>
        `;
    });
}

function renderLeaderboards() {
    const sortedStudents = [...appData.students].sort((a,b) => b.score - a.score);
    const studentTbody = document.getElementById("leaderboard-student");
    studentTbody.innerHTML = "";
    sortedStudents.forEach((s, idx) => {
        const level = getTreeLevel(s.score);
        studentTbody.innerHTML += `
            <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>${formatStudentName(s.name)}</td>
                <td>Tổ ${s.group}</td>
                <td>${level.icon} ${level.title}</td>
                <td><strong>${s.score}</strong></td>
            </tr>
        `;
    });

    const groupStats = [1, 2, 3, 4].map(gNum => {
        const members = appData.students.filter(s => s.group === gNum);
        const total = members.reduce((sum, m) => sum + m.score, 0);
        const avg = members.length ? (total / members.length).toFixed(1) : 0;
        return { group: gNum, count: members.length, total, avg };
    }).sort((a,b) => b.total - a.total);

    const groupTbody = document.getElementById("leaderboard-group");
    groupTbody.innerHTML = "";
    groupStats.forEach((g, idx) => {
        groupTbody.innerHTML += `
            <tr>
                <td><strong>${idx + 1}</strong></td>
                <td>Tổ ${g.group}</td>
                <td>${g.count}</td>
                <td><strong>${g.total}</strong></td>
                <td>${g.avg}</td>
            </tr>
        `;
    });
}

function renderRulesTab() {
    const grid = document.getElementById("rules-display-grid");
    if (!grid) return;
    grid.innerHTML = "";
    rules.forEach(r => {
        grid.innerHTML += `
            <div class="rule-item ${r.type === 'minus' ? 'minus' : ''}">
                <span>${r.name}</span>
                <span class="${r.type === 'plus' ? 'pts-plus' : 'pts-minus'}">${r.pts > 0 ? '+' + r.pts : r.pts}</span>
            </div>
        `;
    });
}

function renderLogs() {
    const tbody = document.getElementById("logs-table");
    if (!tbody) return;
    tbody.innerHTML = "";
    appData.logs.forEach(l => {
        tbody.innerHTML += `
            <tr>
                <td>${l.timestamp}</td>
                <td>${formatStudentName(l.studentName)}</td>
                <td>Tổ ${l.group}</td>
                <td>${l.type}</td>
                <td>${l.content}</td>
                <td class="${l.pts > 0 ? 'pts-plus' : (l.pts < 0 ? 'pts-minus' : '')}">${l.pts !== 0 ? l.pts : '-'}</td>
                <td>${l.note || ''}</td>
            </tr>
        `;
    });
}