import { 
    addLog, addStudent, removeStudent, updateStudentGroup,
    addRule, updateRule, deleteRule,
    updateOfficer, addOfficerRole, deleteOfficerRole,
    updateAttendance, clearAllLogs, updateClassInfo,
    getState 
} from './data.js';
import { isTeacher, setIsTeacher, renderAll, toast } from './ui.js';
import { todayISO } from './utils.js';

// Gán các handler vào window
window.changeGroup = async function(id, val) {
    await updateStudentGroup(id, parseInt(val));
    renderAll();
};

window.setOfficer = async function(id, sid) {
    await updateOfficer(id, sid);
    renderAll();
};

window.setAtt = async function(dateStr, sid, period, val) {
    await updateAttendance(dateStr, sid, period, val);
    renderAll();
};

window.setAttNote = async function(dateStr, sid, field, val) {
    await updateAttendance(dateStr, sid, field, val);
    renderAll();
};

window.removeStudent = async function(id) {
    if (!confirm('Xóa học sinh này?')) return;
    await removeStudent(id);
    renderAll();
    toast('Đã xóa học sinh.');
};

window.removeOfficerRole = async function(id) {
    if (!confirm('Xoá chức vụ này?')) return;
    await deleteOfficerRole(id);
    renderAll();
};

window.deleteRule = async function(id) {
    if (!confirm('Xoá quy định này?')) return;
    await deleteRule(id);
    renderAll();
    toast('Đã xoá quy định.');
};

window.shuffleGroups = async function() {
    const state = getState();
    const n = state.classInfo.numGroups || 4;
    const shuffled = [...state.students].sort(() => Math.random() - 0.5);
    for (const s of shuffled) {
        const newGroup = (shuffled.indexOf(s) % n) + 1;
        await updateStudentGroup(s.id, newGroup);
    }
    renderAll();
    toast('Đã xếp tổ ngẫu nhiên.');
};

window.login = async function(password) {
    const state = getState();
    // Tạm thời so sánh plain text (không an toàn)
    if (password === state.classInfo.password) {
        setIsTeacher(true);
        toast('✅ Đăng nhập thành công.');
        renderAll();
        return true;
    } else {
        toast('❌ Mật khẩu không đúng.');
        return false;
    }
};

window.logout = function() {
    setIsTeacher(false);
    toast('Đã đăng xuất.');
    renderAll();
};