// events.js
// Gán các hàm handler cần thiết vào window để inline onclick hoạt động
window.changeGroup = function(id, val) {
  const s = state.students.find(x => x.id === id);
  if (s) { s.group = parseInt(val); queueSave(); renderAll(); }
};

window.setOfficer = function(id, sid) {
  const o = state.officers.find(x => x.id === id);
  if (o) { o.studentId = sid; queueSave(); }
};

window.setAtt = function(dateStr, sid, period, val) {
  if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
  if (!state.attendance[dateStr][sid]) state.attendance[dateStr][sid] = { morning: '', afternoon: '' };
  state.attendance[dateStr][sid][period] = val;
  queueSave();
  renderAttendance();
};

window.setAttNote = function(dateStr, sid, field, val) {
  if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
  if (!state.attendance[dateStr][sid]) state.attendance[dateStr][sid] = { morning: '', afternoon: '' };
  state.attendance[dateStr][sid][field] = val;
  queueSave();
};

window.removeStudent = function(id) {
  state.students = state.students.filter(s => s.id !== id);
  state.logs = state.logs.filter(l => l.studentId !== id);
  queueSave();
  renderAll();
  toast('Đã xóa học sinh.');
};

window.removeOfficerRole = function(id) {
  if (!confirm('Xoá chức vụ này?')) return;
  state.officers = state.officers.filter(o => o.id !== id);
  queueSave();
  renderAll();
};

window.deleteRule = function(id) {
  if (!confirm('Xoá quy định này?')) return;
  state.rules = state.rules.filter(r => r.id !== id);
  queueSave();
  renderAll();
  toast('Đã xoá quy định.');
};

window.shuffleGroups = function() {
  const n = state.classInfo.numGroups || 4;
  const shuffled = [...state.students].sort(() => Math.random() - 0.5);
  shuffled.forEach((s, i) => s.group = (i % n) + 1);
  queueSave();
  renderAll();
  toast('Đã xếp tổ ngẫu nhiên.');
};

window.login = function(password) {
  if (password === state.classInfo.password) {
    isTeacher = true;
    toast('✅ Đăng nhập thành công với quyền giáo viên.');
    updateUIByRole();
    renderAll();
    return true;
  } else {
    toast('❌ Mật khẩu không đúng.');
    return false;
  }
};

window.logout = function() {
  isTeacher = false;
  toast('Đã đăng xuất.');
  updateUIByRole();
  renderAll();
};