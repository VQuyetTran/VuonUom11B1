// js/main.js
import { supabase } from './supabase-client.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { loadState, getState } from './data.js';
import { 
    renderAll, setIsTeacher, toast, updateUIByRole,
    openStudentModal, closeStudentModal,
    openOfficerRoleModal, closeOfficerRoleModal,
    openRuleModal, closeRuleModal,
    openRecord, closeRecord, openProfile, closeProfile,
    toggleCustomWrap, setProfileRange
} from './ui.js';
import { todayISO } from './utils.js';
import { deleteStudentFromDB } from './events.js';
import './events.js';

// Gán hàm modal ra window
window.openRecord = openRecord; window.closeRecord = closeRecord;
window.openProfile = openProfile; window.closeProfile = closeProfile;
window.openRuleModal = openRuleModal; window.closeRuleModal = closeRuleModal;
window.openStudentModal = openStudentModal; window.closeStudentModal = closeStudentModal;
window.openOfficerRoleModal = openOfficerRoleModal; window.closeOfficerRoleModal = closeOfficerRoleModal;
window.toggleCustomWrap = toggleCustomWrap;

// Hàm chuyển tab
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
function switchPage(pageId) {
    pages.forEach(p => p.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    const targetPage = document.getElementById('page-' + pageId);
    if (targetPage) targetPage.classList.add('active');
    const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (targetNav) targetNav.classList.add('active');
}

document.addEventListener('DOMContentLoaded', async function() {
    const ok = await loadState();
    if (ok) renderAll();
    else toast('❌ Không thể tải dữ liệu.');

    // Gắn sự kiện menu
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            if (pageId) switchPage(pageId);
        });
    });

    // Xử lý Đăng nhập / Đăng xuất
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            const isLoggedIn = localStorage.getItem('isTeacher') === 'true';
            if (!isLoggedIn) {
                const pwd = prompt('Nhập mật khẩu:');
                if (pwd === 'admin123') {
                    setIsTeacher(true);
                    localStorage.setItem('isTeacher', 'true');
                    toast('✅ Đăng nhập thành công!');
                } else {
                    toast('❌ Sai mật khẩu.');
                }
            } else {
                setIsTeacher(false);
                localStorage.removeItem('isTeacher');
                toast('👋 Đã đăng xuất.');
            }
            renderAll(); 
            updateUIByRole(); 
        });
    }

    // ====================================================
    // GẮN SỰ KIỆN CHO CÁC NÚT CHỨC NĂNG (CÓ GHI SUPABASE)
    // ====================================================

    // 0. Xác nhận Ghi nhận điểm (trước đây nút này CHƯA từng được gắn sự kiện,
    //    nên bấm "Ghi nhận điểm" trong modal không lưu gì cả)
    const btnConfirmRecord = document.getElementById('btnConfirmRecord');
    if (btnConfirmRecord) btnConfirmRecord.addEventListener('click', async () => {
        const state = getState();
        const sid = window.recordStudentId;
        const student = state.students.find(s => s.id === sid);
        if (!student) return toast('⚠️ Không tìm thấy học sinh!');

        const ruleId = parseInt(document.getElementById('recordRuleSelect').value, 10);
        const rule = state.rules.find(r => r.id === ruleId);
        if (!rule) return toast('⚠️ Vui lòng chọn một quy định!');

        let points = rule.points;
        if (rule.teacherInput) {
            points = parseInt(document.getElementById('recordCustomPoints').value, 10);
            if (isNaN(points)) return toast('⚠️ Vui lòng nhập số điểm hợp lệ!');
        }

        const date = todayISO();
        const timestamp = Date.now();

        // Ghi xuống Supabase
        const { data, error } = await supabase
            .from('logs')
            .insert([{
                class_id: 1,
                student_id: sid,
                date,
                rule_id: rule.id,
                rule_text: rule.text,
                points,
                timestamp
            }])
            .select();

        if (error) {
            console.error(error);
            toast('❌ Lỗi ghi nhận điểm: ' + error.message);
            return;
        }

        // Cập nhật state với log mới từ database
        state.logs.push({
            id: data[0].id,
            studentId: sid,
            date,
            ruleId: rule.id,
            ruleText: rule.text,
            points,
            timestamp
        });

        closeRecord();
        renderAll();
        toast(`✅ Đã ghi nhận ${points > 0 ? '+' : ''}${points} điểm cho ${student.name}!`);
    });

    // 1. Thêm học sinh
    const btnAddStudent = document.getElementById('btnAddStudent');
    if (btnAddStudent) btnAddStudent.addEventListener('click', openStudentModal);
    
    const btnConfirmAddStudent = document.getElementById('btnConfirmAddStudent');
    if (btnConfirmAddStudent) btnConfirmAddStudent.addEventListener('click', async () => {
        const name = document.getElementById('newStudentName').value.trim();
        const group = parseInt(document.getElementById('newStudentGroup').value);
        const state = getState();
        if (!name) return toast('⚠️ Vui lòng nhập tên!');
        
        // Ghi xuống Supabase
        const { data, error } = await supabase
            .from('students')
            .insert([{ class_id: 1, name, group_number: group }])
            .select();
            
        if (error) {
            console.error(error);
            toast('❌ Lỗi khi thêm học sinh: ' + error.message);
            return;
        }

        // Cập nhật state với ID mới từ database
        const newStudent = {
            id: data[0].id,
            name: data[0].name,
            group: data[0].group_number,
            joinDate: data[0].join_date
        };
        state.students.push(newStudent);
        closeStudentModal();
        renderAll();
        toast(`✅ Đã thêm ${name} vào Tổ ${group}!`);
    });

    // 2. Thêm chức vụ cán sự
    const btnAddOfficerRole = document.getElementById('btnAddOfficerRole');
    if (btnAddOfficerRole) btnAddOfficerRole.addEventListener('click', openOfficerRoleModal);
    
    const btnConfirmAddOfficerRole = document.getElementById('btnConfirmAddOfficerRole');
    if (btnConfirmAddOfficerRole) btnConfirmAddOfficerRole.addEventListener('click', async () => {
        const role = document.getElementById('newOfficerRole').value.trim();
        const state = getState();
        if (!role) return toast('⚠️ Vui lòng nhập tên chức vụ!');
        
        // Ghi xuống Supabase
        const { data, error } = await supabase
            .from('officers')
            .insert([{ class_id: 1, role_name: role, student_id: null }])
            .select();
            
        if (error) {
            console.error(error);
            toast('❌ Lỗi khi thêm chức vụ: ' + error.message);
            return;
        }

        state.officers.push({ id: data[0].id, role: data[0].role_name, studentId: null });
        closeOfficerRoleModal();
        renderAll();
        toast(`✅ Đã thêm chức vụ "${role}"!`);
    });

    // 3. Thêm / Sửa quy định
    const btnAddRule = document.getElementById('btnAddRule');
    if (btnAddRule) btnAddRule.addEventListener('click', () => openRuleModal(null));
    
    const btnSaveRule = document.getElementById('btnSaveRule');
    if (btnSaveRule) btnSaveRule.addEventListener('click', async () => {
        const state = getState();
        const icon = document.getElementById('ruleIcon').value || '⭐';
        const group = document.getElementById('ruleGroupSel').value;
        const text = document.getElementById('ruleContent').value.trim();
        const points = parseInt(document.getElementById('rulePoints').value) || 0;
        const teacherInput = document.getElementById('ruleTeacherInput').checked;
        const desc = document.getElementById('ruleDesc').value.trim();
        
        if (!text) return toast('⚠️ Vui lòng nhập nội dung quy định!');
        
        const editingId = window.editingRuleId;
        
        if (editingId) {
            // Cập nhật quy định
            const { error } = await supabase
                .from('rules')
                .update({ 
                    icon, rule_group: group, text, points, teacher_input: teacherInput, description: desc
                })
                .eq('id', editingId);
                
            if (error) {
                console.error(error);
                toast('❌ Lỗi cập nhật: ' + error.message);
                return;
            }

            const rule = state.rules.find(r => r.id == editingId);
            if (rule) Object.assign(rule, { icon, group, text, points, teacherInput, desc });
            toast('✅ Đã cập nhật quy định!');
        } else {
            // Thêm mới quy định
            const { data, error } = await supabase
                .from('rules')
                .insert([{ 
                    class_id: 1, rule_group: group, icon, text, 
                    points, teacher_input: teacherInput, description: desc 
                }])
                .select();
                
            if (error) {
                console.error(error);
                toast('❌ Lỗi thêm mới: ' + error.message);
                return;
            }

            state.rules.push({ 
                id: data[0].id, icon, group, text, points, teacherInput, desc 
            });
            toast('✅ Đã thêm quy định mới!');
        }
        
        closeRuleModal();
        renderAll();
    });

    // 4. Lưu Cài đặt lớp
    const btnSaveSettings = document.getElementById('btnSaveSettings');
    if (btnSaveSettings) btnSaveSettings.addEventListener('click', async () => {
        const state = getState();
        const c = state.classInfo;
        
        const school = document.getElementById('setSchool').value;
        const className = document.getElementById('setClassName').value;
        const teacher = document.getElementById('setTeacher').value;
        const schoolYear = document.getElementById('setYear').value;
        const week1Start = document.getElementById('setWeek1').value;
        const week2Start = document.getElementById('setWeek2').value;
        const totalWeeks = parseInt(document.getElementById('setTotalWeeks').value) || 38;
        const hk1Weeks = parseInt(document.getElementById('setHk1Weeks').value) || 18;
        const numGroups = parseInt(document.getElementById('setNumGroups').value) || 4;
        
        // Ghi xuống bảng classes
        const { error } = await supabase
            .from('classes')
            .update({ 
                school, class_name: className, teacher, school_year: schoolYear,
                week1_start: week1Start, week2_start: week2Start,
                total_weeks: totalWeeks, hk1_weeks: hk1Weeks, num_groups: numGroups
            })
            .eq('id', 1);
            
        if (error) {
            console.error(error);
            toast('❌ Lỗi lưu cài đặt: ' + error.message);
            return;
        }

        // Cập nhật state
        Object.assign(c, { school, className, teacher, schoolYear, week1Start, week2Start, totalWeeks, hk1Weeks, numGroups });
        toast('💾 Đã lưu cài đặt lớp lên Supabase!');
        renderAll();
    });

    // 5. Áp dụng danh sách nhanh
    // TRƯỚC ĐÂY: luôn insert toàn bộ các dòng như học sinh MỚI, không đối chiếu tên
    // trùng, không xoá tên bị bỏ khỏi danh sách -> gây trùng lặp học sinh trong DB,
    // và vì renderSettings() luôn ghi đè lại ô textarea theo state.students sau khi
    // renderAll(), người dùng thấy như "danh sách quay về danh sách cũ".
    // NAY: đối chiếu tên trùng để GIỮ nguyên dữ liệu điểm, chỉ thêm tên mới (0 điểm),
    // và xoá (cascading) những học sinh không còn trong danh sách mới.
    const btnApplyList = document.getElementById('btnApplyList');
    if (btnApplyList) btnApplyList.addEventListener('click', async () => {
        const raw = document.getElementById('quickList').value;
        const names = raw.split('\n').map(n => n.trim()).filter(n => n);
        const state = getState();
        if (!names.length) return toast('⚠️ Danh sách rỗng!');

        const numGroups = state.classInfo.numGroups || 4;
        const newNameSet = new Set(names);

        // Học sinh hiện có nhưng không còn trong danh sách mới -> sẽ bị xoá
        const toRemove = state.students.filter(s => !newNameSet.has(s.name));
        // Tên mới hoàn toàn (chưa từng có trong lớp) -> sẽ được thêm, 0 điểm
        const existingNameSet = new Set(state.students.map(s => s.name));
        const toAddNames = names.filter(n => !existingNameSet.has(n));

        if (!confirm(
            `Áp dụng danh sách sẽ:\n` +
            `- Giữ nguyên điểm của ${names.length - toAddNames.length} học sinh trùng tên.\n` +
            `- Thêm mới ${toAddNames.length} học sinh (0 điểm).\n` +
            (toRemove.length ? `- XOÁ ${toRemove.length} học sinh không còn trong danh sách (kèm toàn bộ điểm danh/nhật ký của họ).\n` : '') +
            `Tiếp tục?`
        )) return;

        // 1) Xoá học sinh không còn trong danh sách (cascading, an toàn với khoá ngoại)
        for (const s of toRemove) {
            const { error } = await deleteStudentFromDB(s.id);
            if (error) {
                console.error(error);
                toast(`❌ Không thể xoá "${s.name}": ` + error.message);
                continue; // vẫn tiếp tục xử lý các học sinh khác
            }
            state.students = state.students.filter(x => x.id !== s.id);
            state.logs = state.logs.filter(l => l.studentId !== s.id);
            state.officers.forEach(o => { if (o.studentId === s.id) o.studentId = null; });
            Object.keys(state.attendance).forEach(date => { delete state.attendance[date][s.id]; });
        }

        // 2) Thêm học sinh mới, chia đều tổ dựa trên sĩ số hiện tại
        if (toAddNames.length) {
            const rows = toAddNames.map((name, idx) => ({
                class_id: 1,
                name,
                group_number: ((state.students.length + idx) % numGroups) + 1
            }));

            const { data, error } = await supabase
                .from('students')
                .insert(rows)
                .select();

            if (error) {
                console.error(error);
                toast('❌ Lỗi khi thêm danh sách: ' + error.message);
                renderAll();
                return;
            }

            data.forEach(s => {
                state.students.push({ id: s.id, name: s.name, group: s.group_number, joinDate: s.join_date });
            });
        }

        renderAll();
        toast(`✅ Đã áp dụng danh sách: giữ ${names.length - toAddNames.length}, thêm ${toAddNames.length}${toRemove.length ? `, xoá ${toRemove.length}` : ''}.`);
    });

    // 6. Xáo trộn tổ (Cập nhật tổ xuống DB)
    async function shuffleGroups() {
        const state = getState();
        if (!state) return;
        const numGroups = state.classInfo.numGroups || 4;
        
        // Cập nhật tổ cho từng học sinh lên DB
        const updates = state.students.map((s, i) => ({
            id: s.id,
            group_number: (i % numGroups) + 1
        }));

        // Dùng upsert để cập nhật hàng loạt
        const { error } = await supabase
            .from('students')
            .upsert(updates);

        if (error) {
            console.error(error);
            toast('❌ Lỗi xếp tổ: ' + error.message);
            return;
        }

        // Cập nhật state
        state.students.forEach((s, i) => {
            s.group = (i % numGroups) + 1;
        });
        
        renderAll();
        toast('🔄 Đã xếp lại tổ ngẫu nhiên và lưu lên DB!');
    }

    const btnShuffleGroups = document.getElementById('btnShuffleGroups');
    if (btnShuffleGroups) btnShuffleGroups.addEventListener('click', shuffleGroups);
    
    const btnShuffleGroups2 = document.getElementById('btnShuffleGroups2');
    if (btnShuffleGroups2) btnShuffleGroups2.addEventListener('click', shuffleGroups);

    // 7. Xuất / Nhập JSON
    const btnExportJson = document.getElementById('btnExportJson');
    if (btnExportJson) btnExportJson.addEventListener('click', () => {
        const state = getState();
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'class_data_backup.json'; a.click();
        toast('⬇️ Đã xuất file JSON!');
    });

    const btnImportJson = document.getElementById('btnImportJson');
    const importFile = document.getElementById('importFile');
    if (btnImportJson && importFile) {
        btnImportJson.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    console.log("Data import:", data);
                    toast('⬆️ Đã đọc file JSON! (Cần cập nhật logic để gán lại State)');
                } catch (err) {
                    toast('❌ File JSON không hợp lệ!');
                }
            };
            reader.readAsText(file);
        });
    }

    // 7b. Khởi tạo lớp mới (trước đây nút này CHƯA từng được gắn sự kiện, bấm vào không có gì xảy ra)
    // Đây là thao tác NGUY HIỂM (xoá sạch dữ liệu thi đua để bắt đầu lại), nên bắt buộc
    // gõ đúng cụm xác nhận thay vì chỉ 1 hộp thoại confirm() đơn giản.
    const btnResetClass = document.getElementById('btnResetClass');
    if (btnResetClass) btnResetClass.addEventListener('click', async () => {
        const state = getState();
        const typed = prompt(
            'Thao tác này sẽ XOÁ TOÀN BỘ học sinh, điểm danh, nhật ký điểm và phân công cán sự của lớp hiện tại (giữ lại quy định điểm và thông tin lớp).\n\n' +
            'Gõ chính xác "KHOI TAO LOP MOI" để xác nhận:'
        );
        if (typed !== 'KHOI TAO LOP MOI') {
            if (typed !== null) toast('❌ Chưa xác nhận đúng cụm từ, huỷ thao tác.');
            return;
        }

        // Xoá theo đúng thứ tự để không vướng khoá ngoại: attendance -> logs -> officers (gỡ gán) -> students
        const { error: e1 } = await supabase.from('attendance').delete().eq('class_id', 1);
        if (e1) { console.error(e1); toast('❌ Lỗi xoá điểm danh: ' + e1.message); return; }

        const { error: e2 } = await supabase.from('logs').delete().eq('class_id', 1);
        if (e2) { console.error(e2); toast('❌ Lỗi xoá nhật ký: ' + e2.message); return; }

        const { error: e3 } = await supabase.from('officers').update({ student_id: null }).eq('class_id', 1);
        if (e3) { console.error(e3); toast('❌ Lỗi gỡ phân công cán sự: ' + e3.message); return; }

        const { data: delStudents, error: e4 } = await supabase.from('students').delete().eq('class_id', 1).select();
        if (e4) { console.error(e4); toast('❌ Lỗi xoá học sinh: ' + e4.message); return; }

        // Cập nhật state cục bộ
        state.students = [];
        state.logs = [];
        state.attendance = {};
        state.officers.forEach(o => { o.studentId = null; });

        renderAll();
        toast(`✅ Đã khởi tạo lại lớp (đã xoá ${delStudents ? delStudents.length : 0} học sinh và toàn bộ dữ liệu thi đua liên quan).`);
    });

    // 8. Lưu điểm danh (Xóa cũ, thêm mới - An toàn với schema hiện tại)
    const btnAllPresent = document.getElementById('btnAllPresent');
    if (btnAllPresent) btnAllPresent.addEventListener('click', () => toast('Chức năng điểm danh cả lớp đang được phát triển!'));
    
    const btnSaveAttendance = document.getElementById('btnSaveAttendance');
    if (btnSaveAttendance) btnSaveAttendance.addEventListener('click', async () => {
        const state = getState();
        const date = document.getElementById('attDate').value;
        if (!date) return toast('⚠️ Chưa chọn ngày!');

        const rows = [];
        state.students.forEach(s => {
            const rec = state.attendance[date]?.[s.id];
            if (rec) {
                rows.push({
                    class_id: 1,
                    student_id: s.id,
                    date: date,
                    morning_status: rec.morning || '',
                    afternoon_status: rec.afternoon || '',
                    morning_note: rec.morningNote || '',
                    afternoon_note: rec.afternoonNote || ''
                });
            }
        });

        // Cách an toàn: Xóa dữ liệu cũ trong ngày rồi chèn mới
        const { error: delErr } = await supabase
            .from('attendance')
            .delete()
            .eq('class_id', 1)
            .eq('date', date);

        if (delErr) {
            console.error(delErr);
            toast('❌ Lỗi xóa dữ liệu cũ: ' + delErr.message);
            return;
        }

        if (rows.length > 0) {
            const { error } = await supabase
                .from('attendance')
                .insert(rows);

            if (error) {
                console.error(error);
                toast('❌ Lỗi lưu điểm danh: ' + error.message);
                return;
            }
        }

        renderAll(); // đồng bộ ngay Khu vườn/Xếp hạng vì điểm chuyên cần ảnh hưởng tới tổng điểm
        toast('✅ Đã lưu điểm danh lên Supabase!');
    });

    // Bắt đầu ở trang Khu vườn
    switchPage('garden');

    // Gắn sự kiện cho 4 tab thời gian trong modal "Hồ sơ thi đua cá nhân"
    // (Tuần / Tháng / Học kì / Toàn năm) — trước đây các nút này KHÔNG hề có
    // sự kiện, nên bấm vào không đổi gì và số liệu không khớp với điểm thật.
    document.querySelectorAll('.profile-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            setProfileRange(btn.getAttribute('data-range'));
        });
    });
});