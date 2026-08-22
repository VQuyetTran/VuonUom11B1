// main.js
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  renderAll();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const page = this.dataset.page || this.getAttribute('data-page');
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      const target = document.getElementById('page-' + page);
      if (target) target.classList.add('active');
    });
  });

  // Login button
  document.getElementById('loginBtn').addEventListener('click', function() {
    if (isTeacher) { logout(); return; }
    const pwd = prompt('Nhập mật khẩu giáo viên:');
    if (pwd !== null) login(pwd);
  });

  // Buttons
  document.getElementById('btnAddStudent').addEventListener('click', openStudentModal);
  document.getElementById('btnAddOfficerRole').addEventListener('click', openOfficerRoleModal);
  document.getElementById('btnAddRule').addEventListener('click', () => openRuleModal(null));
  document.getElementById('btnShuffleGroups').addEventListener('click', shuffleGroups);
  document.getElementById('btnShuffleGroups2').addEventListener('click', shuffleGroups);

  // Attendance
  document.getElementById('attDate').addEventListener('change', renderAttendance);
  document.getElementById('btnAllPresent').addEventListener('click', () => {
    if (!isTeacher) return;
    const dateStr = document.getElementById('attDate').value || todayISO();
    state.students.forEach(s => {
      if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
      if (!state.attendance[dateStr][s.id]) state.attendance[dateStr][s.id] = { morning: '', afternoon: '' };
      state.attendance[dateStr][s.id].morning = 'present';
      state.attendance[dateStr][s.id].afternoon = 'present';
    });
    queueSave();
    renderAttendance();
    toast('Đã điểm danh cả hai buổi.');
  });
  document.getElementById('btnSaveAttendance').addEventListener('click', () => { saveState(); toast('Đã lưu điểm danh.'); });

  // Settings
  document.getElementById('btnApplyList').addEventListener('click', () => {
    const lines = document.getElementById('quickList').value.split('\n').map(l => l.trim()).filter(Boolean);
    const existing = Object.fromEntries(state.students.map(s => [s.name, s]));
    const n = state.classInfo.numGroups || 4;
    const newStudents = lines.map((name, i) => existing[name] || { id: 's'+Date.now()+i, name, group: (i % n) + 1, joinDate: todayISO() });
    state.students = newStudents;
    queueSave();
    renderAll();
    toast('Đã cập nhật danh sách.');
  });
  document.getElementById('btnSaveSettings').addEventListener('click', () => {
    const c = state.classInfo;
    c.school = document.getElementById('setSchool').value;
    c.className = document.getElementById('setClassName').value;
    c.teacher = document.getElementById('setTeacher').value;
    c.schoolYear = document.getElementById('setYear').value;
    c.week1Start = document.getElementById('setWeek1').value;
    c.week2Start = document.getElementById('setWeek2').value;
    c.totalWeeks = parseInt(document.getElementById('setTotalWeeks').value) || 38;
    c.hk1Weeks = parseInt(document.getElementById('setHk1Weeks').value) || 18;
    c.numGroups = parseInt(document.getElementById('setNumGroups').value) || 4;
    const p1 = document.getElementById('setPwd1').value, p2 = document.getElementById('setPwd2').value;
    if (p1 || p2) {
      if (p1 !== p2) { alert('Mật khẩu không khớp.'); return; }
      c.password = p1;
    }
    saveState();
    renderAll();
    toast('Đã lưu cài đặt.');
  });

  // Export/Import
  document.getElementById('btnExportJson').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vuon-uom-' + state.classInfo.className + '.json'; a.click();
    URL.revokeObjectURL(url);
  });
  document.getElementById('btnImportJson').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function() {
      try { const data = JSON.parse(reader.result); state = data; saveState(); renderAll(); alert('Đã nhập dữ liệu.'); }
      catch(err) { alert('File không hợp lệ.'); }
    };
    reader.readAsText(file);
  });
  document.getElementById('btnResetClass').addEventListener('click', () => {
    if (!confirm('Khởi tạo lớp mới sẽ xoá toàn bộ dữ liệu. Tiếp tục?')) return;
    state = defaultState();
    saveState();
    renderAll();
    toast('Đã khởi tạo lớp mới.');
  });

  // Search & filter
  document.getElementById('gardenSearch').addEventListener('input', renderGarden);
  document.getElementById('gardenGroupFilter').addEventListener('change', renderGarden);

  // Clear log
  document.getElementById('btnClearLog').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ nhật ký?')) return;
    state.logs = [];
    queueSave();
    renderAll();
    toast('Đã xoá nhật ký.');
  });

  // Summary select
  document.getElementById('summaryWeekSelect').addEventListener('change', renderSummary);
  document.getElementById('summaryType').addEventListener('change', renderSummary);

  // Record rule select change
  document.getElementById('recordRuleSelect').addEventListener('change', toggleCustomWrap);

  // Confirm record
  document.getElementById('btnConfirmRecord').addEventListener('click', () => {
    const rid = document.getElementById('recordRuleSelect').value;
    const r = state.rules.find(x => x.id === rid);
    if (!r || !recordStudentId) return;
    const pts = r.teacherInput ? (parseInt(document.getElementById('recordCustomPoints').value) || 0) : r.points;
    const s = state.students.find(x => x.id === recordStudentId);
    state.logs.push({
      id: 'l'+Date.now(),
      studentId: recordStudentId,
      date: todayISO(),
      ruleId: r.id,
      ruleText: r.text,
      points: pts,
      ts: Date.now(),
      content: r.text
    });
    queueSave();
    closeRecord();
    renderAll();
    toast('✓ Đã ghi nhận ' + (pts > 0 ? '+' : '') + pts + ' điểm cho ' + s.name);
  });

  // Save rule
  document.getElementById('btnSaveRule').addEventListener('click', () => {
    const data = {
      icon: document.getElementById('ruleIcon').value.trim() || '⭐',
      group: document.getElementById('ruleGroupSel').value,
      text: document.getElementById('ruleContent').value.trim() || 'Quy định mới',
      points: parseInt(document.getElementById('rulePoints').value) || 0,
      teacherInput: document.getElementById('ruleTeacherInput').checked,
      desc: document.getElementById('ruleDesc').value.trim()
    };
    if (editingRuleId) {
      const r = state.rules.find(x => x.id === editingRuleId);
      if (r) Object.assign(r, data);
    } else {
      state.rules.push({ id: 'r'+Date.now(), ...data });
    }
    queueSave();
    closeRuleModal();
    renderAll();
    toast('Đã lưu quy định.');
  });

  // Add student
  document.getElementById('btnConfirmAddStudent').addEventListener('click', () => {
    const name = document.getElementById('newStudentName').value.trim();
    if (!name) { toast('Nhập tên học sinh.'); return; }
    const group = parseInt(document.getElementById('newStudentGroup').value);
    state.students.push({ id: 's'+Date.now(), name, group, joinDate: todayISO() });
    queueSave();
    closeStudentModal();
    renderAll();
    toast('Đã thêm học sinh ' + name);
  });

  // Add officer role
  document.getElementById('btnConfirmAddOfficerRole').addEventListener('click', () => {
    const role = document.getElementById('newOfficerRole').value.trim();
    if (!role) { toast('Nhập tên chức vụ.'); return; }
    state.officers.push({ id: 'o'+Date.now(), role, studentId: '' });
    queueSave();
    closeOfficerRoleModal();
    renderAll();
    toast('Đã thêm chức vụ.');
  });
});