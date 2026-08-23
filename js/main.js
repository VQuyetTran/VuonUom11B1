import { loadState, addLog, addStudent, addRule, updateRule, deleteRule, addOfficerRole, updateClassInfo, clearAllLogs, getState } from './data.js';
import { renderAll, isTeacher, setIsTeacher, toast, openRecord, openProfile, closeProfile, openRuleModal, closeRuleModal, openStudentModal, closeStudentModal, openOfficerRoleModal, closeOfficerRoleModal, toggleCustomWrap } from './ui.js';
import { login, logout } from './events.js';
import { todayISO } from './utils.js';

// Biến toàn cục cho modal
window.recordStudentId = null;
window.editingRuleId = null;

document.addEventListener('DOMContentLoaded', async function() {
    // Load dữ liệu
    const ok = await loadState();
    if (!ok) {
        toast('Không thể tải dữ liệu. Kiểm tra kết nối.', 'error');
    }
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

    // Login
    document.getElementById('loginBtn').addEventListener('click', function() {
        if (isTeacher) { logout(); return; }
        const pwd = prompt('Nhập mật khẩu giáo viên:');
        if (pwd !== null) login(pwd);
    });

    // Các nút
    document.getElementById('btnAddStudent').addEventListener('click', openStudentModal);
    document.getElementById('btnAddOfficerRole').addEventListener('click', openOfficerRoleModal);
    document.getElementById('btnAddRule').addEventListener('click', () => openRuleModal(null));
    document.getElementById('btnShuffleGroups').addEventListener('click', window.shuffleGroups);
    document.getElementById('btnShuffleGroups2').addEventListener('click', window.shuffleGroups);

    // Attendance
    document.getElementById('attDate').addEventListener('change', renderAll);
    document.getElementById('btnAllPresent').addEventListener('click', async () => {
        if (!isTeacher) return;
        const dateStr = document.getElementById('attDate').value || todayISO();
        const state = getState();
        for (const s of state.students) {
            await updateAttendance(dateStr, s.id, 'morning', 'present');
            await updateAttendance(dateStr, s.id, 'afternoon', 'present');
        }
        renderAll();
        toast('Đã điểm danh cả hai buổi.');
    });
    document.getElementById('btnSaveAttendance').addEventListener('click', () => { toast('Đã lưu điểm danh.'); });

    // Settings
    document.getElementById('btnApplyList').addEventListener('click', async () => {
        const lines = document.getElementById('quickList').value.split('\n').map(l => l.trim()).filter(Boolean);
        const state = getState();
        // Xóa hết học sinh cũ
        for (const s of state.students) {
            await removeStudent(s.id);
        }
        // Thêm mới
        const n = state.classInfo.numGroups || 4;
        for (let i = 0; i < lines.length; i++) {
            await addStudent(lines[i], (i % n) + 1);
        }
        renderAll();
        toast('Đã cập nhật danh sách.');
    });

    document.getElementById('btnSaveSettings').addEventListener('click', async () => {
        const classInfo = {
            school: document.getElementById('setSchool').value,
            className: document.getElementById('setClassName').value,
            teacher: document.getElementById('setTeacher').value,
            schoolYear: document.getElementById('setYear').value,
            week1Start: document.getElementById('setWeek1').value,
            week2Start: document.getElementById('setWeek2').value,
            totalWeeks: parseInt(document.getElementById('setTotalWeeks').value) || 38,
            hk1Weeks: parseInt(document.getElementById('setHk1Weeks').value) || 18,
            numGroups: parseInt(document.getElementById('setNumGroups').value) || 4,
        };
        const p1 = document.getElementById('setPwd1').value;
        const p2 = document.getElementById('setPwd2').value;
        if (p1 || p2) {
            if (p1 !== p2) { alert('Mật khẩu không khớp.'); return; }
            classInfo.password = p1;
        }
        await updateClassInfo(classInfo);
        renderAll();
        toast('Đã lưu cài đặt.');
    });

    // Export/Import
    document.getElementById('btnExportJson').addEventListener('click', () => {
        const state = getState();
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
        reader.onload = async function() {
            try { 
                const data = JSON.parse(reader.result);
                alert('Chức năng nhập JSON cần phát triển thêm để đồng bộ với DB.');
            } catch(err) { alert('File không hợp lệ.'); }
        };
        reader.readAsText(file);
    });
    document.getElementById('btnResetClass').addEventListener('click', () => {
        alert('Chức năng này cần phát triển thêm. Hãy xóa dữ liệu thủ công qua Supabase.');
    });

    // Search & filter
    document.getElementById('gardenSearch').addEventListener('input', renderAll);
    document.getElementById('gardenGroupFilter').addEventListener('change', renderAll);

    // Clear log
    document.getElementById('btnClearLog').addEventListener('click', async () => {
        if (!confirm('Xoá toàn bộ nhật ký?')) return;
        await clearAllLogs();
        renderAll();
        toast('Đã xoá nhật ký.');
    });

    // Summary
    document.getElementById('summaryWeekSelect').addEventListener('change', renderAll);
    document.getElementById('summaryType').addEventListener('change', renderAll);

    // Record rule select change
    document.getElementById('recordRuleSelect').addEventListener('change', toggleCustomWrap);

    // Confirm record
    document.getElementById('btnConfirmRecord').addEventListener('click', async () => {
        const rid = document.getElementById('recordRuleSelect').value;
        const state = getState();
        const r = state.rules.find(x => x.id == rid);
        if (!r || !window.recordStudentId) return;
        const pts = r.teacherInput ? (parseInt(document.getElementById('recordCustomPoints').value) || 0) : r.points;
        const s = state.students.find(x => x.id === window.recordStudentId);
        await addLog(window.recordStudentId, rid, r.text, pts);
        closeRecord();
        renderAll();
        toast('✓ Đã ghi nhận ' + (pts > 0 ? '+' : '') + pts + ' điểm cho ' + s.name);
    });

    // Save rule
    document.getElementById('btnSaveRule').addEventListener('click', async () => {
        const data = {
            icon: document.getElementById('ruleIcon').value.trim() || '⭐',
            group: document.getElementById('ruleGroupSel').value,
            text: document.getElementById('ruleContent').value.trim() || 'Quy định mới',
            points: parseInt(document.getElementById('rulePoints').value) || 0,
            teacherInput: document.getElementById('ruleTeacherInput').checked,
            desc: document.getElementById('ruleDesc').value.trim()
        };
        if (window.editingRuleId) {
            await updateRule(window.editingRuleId, data);
        } else {
            await addRule(data);
        }
        closeRuleModal();
        renderAll();
        toast('Đã lưu quy định.');
    });

    // Add student
    document.getElementById('btnConfirmAddStudent').addEventListener('click', async () => {
        const name = document.getElementById('newStudentName').value.trim();
        if (!name) { toast('Nhập tên học sinh.'); return; }
        const group = parseInt(document.getElementById('newStudentGroup').value);
        await addStudent(name, group);
        closeStudentModal();
        renderAll();
        toast('Đã thêm học sinh ' + name);
    });

    // Add officer role
    document.getElementById('btnConfirmAddOfficerRole').addEventListener('click', async () => {
        const role = document.getElementById('newOfficerRole').value.trim();
        if (!role) { toast('Nhập tên chức vụ.'); return; }
        await addOfficerRole(role);
        closeOfficerRoleModal();
        renderAll();
        toast('Đã thêm chức vụ.');
    });
});