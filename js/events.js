let activeStudentId = null;
let selectedRuleId = null;
let lastAction = null;

function switchTab(tabId) {
    document.querySelectorAll(".tab-section").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.getElementById(`tab-${tabId}`).classList.add("active");
    event.currentTarget.classList.add("active");
}

function openScoreModal(studentId) {
    activeStudentId = studentId;
    selectedRuleId = null;
    const student = appData.students.find(s => s.id === studentId);
    document.getElementById("modal-student-name").innerText = `Ghi nhận cho ${student.name}`;
    document.getElementById("modal-note").value = "";

    const rulesGrid = document.getElementById("modal-rules-grid");
    rulesGrid.innerHTML = "";

    rules.forEach(r => {
        const item = document.createElement("div");
        item.className = `rule-item ${r.type === 'minus' ? 'minus' : ''}`;
        item.onclick = () => {
            document.querySelectorAll("#modal-rules-grid .rule-item").forEach(el => el.classList.remove("selected"));
            item.classList.add("selected");
            selectedRuleId = r.id;
        };
        item.innerHTML = `
            <span>${r.name}</span>
            <span class="${r.type === 'plus' ? 'pts-plus' : 'pts-minus'}">${r.pts > 0 ? '+' + r.pts : r.pts}</span>
        `;
        rulesGrid.appendChild(item);
    });

    document.getElementById("score-modal").classList.add("active");
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

function submitScore() {
    if (!activeStudentId || !selectedRuleId) {
        alert("Vui lòng chọn một quy định cộng/trừ điểm!");
        return;
    }

    const student = appData.students.find(s => s.id === activeStudentId);
    const rule = rules.find(r => r.id === selectedRuleId);
    const note = document.getElementById("modal-note").value;

    lastAction = {
        type: 'SCORE',
        studentId: student.id,
        prevScore: student.score,
        logId: Date.now()
    };

    student.score += rule.pts;

    appData.logs.unshift({
        id: lastAction.logId,
        timestamp: new Date().toLocaleString("vi-VN"),
        studentName: student.name,
        group: student.group,
        type: rule.type === 'plus' ? 'Cộng điểm' : 'Trừ điểm',
        content: rule.name,
        pts: rule.pts,
        note: note
    });

    saveData();
    closeModal("score-modal");
    renderAll();
    showToast(`Đã ghi ${rule.pts > 0 ? '+' + rule.pts : rule.pts} điểm cho ${student.name}`);
}

function changeGroup(studentId, newGroup) {
    const student = appData.students.find(s => s.id === studentId);
    const oldGroup = student.group;
    student.group = parseInt(newGroup);

    appData.logs.unshift({
        id: Date.now(),
        timestamp: new Date().toLocaleString("vi-VN"),
        studentName: student.name,
        group: student.group,
        type: 'Chuyển tổ',
        content: `Chuyển từ Tổ ${oldGroup} sang Tổ ${newGroup}`,
        pts: 0,
        note: ''
    });

    saveData();
    renderAll();
    showToast(`Đã chuyển ${student.name} sang Tổ ${newGroup}`);
}

function autoDistributeGroups() {
    appData.students.forEach((s, idx) => {
        s.group = (idx % 4) + 1;
    });
    saveData();
    renderAll();
    showToast("Đã phân chia đều các tổ thành công!");
}

function generateReport() {
    const weekNum = document.getElementById("summary-week-num").value;
    const output = document.getElementById("report-output");
    const content = document.getElementById("report-content");

    content.innerHTML = `
        <h2>BÁO CÁO TỔNG KẾT TUẦN ${weekNum} - LỚP 11B1</h2>
        <p><strong>Ngày lập:</strong> ${new Date().toLocaleDateString("vi-VN")} | <strong>GVCN:</strong> ${classInfo.teacher}</p>
        <hr style="margin:10px 0;">
        <p><strong>Tổng số ghi nhận trong hệ thống:</strong> ${appData.logs.length} lượt</p>
        <p><strong>Tổng điểm ròng toàn lớp:</strong> ${appData.students.reduce((a,b)=>a+b.score,0)} điểm</p>
    `;
    output.style.display = "block";
}

function toggleAnonymize() {
    appData.isAnonymized = !appData.isAnonymized;
    renderAll();
}

function backupJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `Vuon_Uom_11B1_Backup_${Date.now()}.json`);
    dlAnchorElem.click();
}

function restoreJSON(event) {
    const fileReader = new FileReader();
    fileReader.onload = function(e) {
        appData = JSON.parse(e.target.result);
        saveData();
        renderAll();
        alert("Khôi phục dữ liệu thành công!");
    };
    fileReader.readAsText(event.target.files[0]);
}

function resetAllData() {
    if (confirm("Bạn có chắc chắn muốn đặt lại dữ liệu về ban đầu không?")) {
        initDefaultData();
        renderAll();
        alert("Đã đặt lại dữ liệu!");
    }
}

function exportCSV() {
    let csv = "\uFEFFSTT,Họ và tên,Tổ,Điểm\n";
    appData.students.forEach((s, idx) => {
        csv += `${idx + 1},${s.name},${s.group},${s.score}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Diem_Lop_11B1.csv";
    link.click();
}

function showToast(msg) {
    const toast = document.getElementById("toast");
    document.getElementById("toast-msg").innerText = msg;
    toast.classList.add("active");
    setTimeout(() => toast.classList.remove("active"), 4000);
}

function undoLastAction() {
    if (!lastAction) return;
    if (lastAction.type === 'SCORE') {
        const student = appData.students.find(s => s.id === lastAction.studentId);
        student.score = lastAction.prevScore;
        appData.logs = appData.logs.filter(l => l.id !== lastAction.logId);
        saveData();
        renderAll();
        showToast("Đã hoàn tác thao tác thành công!");
        lastAction = null;
    }
}