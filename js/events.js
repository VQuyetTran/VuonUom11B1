// events.js
import { supabase } from './supabase-client.js';
import { getState } from './data.js';
import { toast, renderAll, renderAttendance } from './ui.js';

// ------------------------------------------------------------------
// Xoá học sinh khỏi Supabase một cách AN TOÀN.
// Các bảng logs / attendance / officers đều có khoá ngoại tới students
// và KHÔNG có ON DELETE CASCADE, nên nếu xoá thẳng students trước sẽ bị
// Postgres từ chối (foreign key violation) hoặc bị RLS chặn âm thầm
// (trả về error = null nhưng không xoá được dòng nào).
// => Phải dọn dữ liệu liên quan trước, rồi mới xoá students, và luôn
// kiểm tra dữ liệu trả về để biết chắc là đã xoá thật trên DB.
// ------------------------------------------------------------------
export async function deleteStudentFromDB(id) {
    // 1. Xoá điểm danh của học sinh này
    const { error: attErr } = await supabase.from('attendance').delete().eq('student_id', id);
    if (attErr) return { error: attErr };

    // 2. Xoá nhật ký điểm của học sinh này
    const { error: logErr } = await supabase.from('logs').delete().eq('student_id', id);
    if (logErr) return { error: logErr };

    // 3. Gỡ học sinh khỏi các chức vụ cán sự (không xoá chức vụ, chỉ bỏ gán)
    const { error: offErr } = await supabase.from('officers').update({ student_id: null }).eq('student_id', id);
    if (offErr) return { error: offErr };

    // 4. Cuối cùng mới xoá học sinh, dùng .select() để biết chắc có xoá được dòng nào không
    //    (RLS có thể chặn âm thầm và trả về error=null nhưng data=[])
    const { data, error } = await supabase.from('students').delete().eq('id', id).select();
    if (error) return { error };
    if (!data || data.length === 0) {
        return { error: { message: 'Không có quyền xoá (có thể do RLS/Row Level Security trên Supabase chưa cho phép DELETE).' } };
    }
    return { data };
}

// Dọn state cục bộ tương ứng với việc xoá 1 học sinh (dùng chung cho removeStudent & áp dụng danh sách)
function purgeStudentFromState(state, id) {
    state.students = state.students.filter(s => s.id != id);
    state.logs = state.logs.filter(l => l.studentId != id);
    state.officers.forEach(o => { if (o.studentId == id) o.studentId = null; });
    Object.keys(state.attendance).forEach(date => {
        if (state.attendance[date][id]) delete state.attendance[date][id];
    });
}

// Hàm cập nhật nhóm học sinh
window.changeGroup = async function(id, val) {
    const state = getState();
    const student = state.students.find(s => s.id == id);
    if (student) {
        // Cập nhật lên Supabase
        const { error } = await supabase
            .from('students')
            .update({ group_number: parseInt(val) })
            .eq('id', id);

        if (error) {
            console.error(error);
            toast('❌ Lỗi chuyển tổ: ' + error.message);
            return;
        }

        student.group = parseInt(val);
        // Render lại toàn bộ để "Khu vườn", "Sĩ số theo tổ", "Xếp hạng" đồng bộ ngay với thay đổi này
        renderAll();
        toast(`✅ Đã chuyển ${student.name} sang tổ ${val}`);
    }
};

// Hàm phân công cán sự
window.setOfficer = async function(id, val) {
    const state = getState();
    const officer = state.officers.find(o => o.id == id);
    if (officer) {
        const studentId = val ? val : null; // Nếu val rỗng thì gán null

        // Cập nhật lên Supabase
        const { error } = await supabase
            .from('officers')
            .update({ student_id: studentId })
            .eq('id', id);

        if (error) {
            console.error(error);
            toast('❌ Lỗi phân công: ' + error.message);
            return;
        }

        officer.studentId = studentId;
        const student = state.students.find(s => s.id == studentId);
        toast(`✅ Đã phân công ${student ? student.name : 'trống'} cho chức vụ ${officer.role}`);
    }
};

// Hàm xóa học sinh (đã xoá cascading dữ liệu liên quan để tránh lỗi khoá ngoại / xoá không thành công)
window.removeStudent = async function(id) {
    const state = getState();
    const student = state.students.find(s => s.id == id);
    if (!student) return;

    if (confirm(`Xóa học sinh ${student.name}? Toàn bộ điểm danh và nhật ký điểm của học sinh này cũng sẽ bị xoá.`)) {
        const { error } = await deleteStudentFromDB(id);

        if (error) {
            console.error(error);
            toast('❌ Lỗi xóa: ' + error.message);
            return; // KHÔNG đụng vào state nếu DB chưa chắc đã xoá — tránh tình trạng F5 lại thấy học sinh còn nguyên
        }

        // Chỉ cập nhật state khi đã CHẮC CHẮN xoá được trên Supabase
        purgeStudentFromState(state, id);
        renderAll();
        toast(`✅ Đã xóa ${student.name}`);
    }
};

// Hàm xoá quy định (trước đây nút "Xoá" ở mục Quy định gọi window.deleteRule nhưng
// hàm này chưa từng được định nghĩa ở bất kỳ file nào, gây lỗi khi bấm)
window.deleteRule = async function(id) {
    const state = getState();
    const rule = state.rules.find(r => r.id == id);
    if (!rule) return;

    if (confirm(`Xóa quy định "${rule.text}"?`)) {
        const { error } = await supabase
            .from('rules')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            toast('❌ Lỗi xóa quy định: ' + error.message);
            return;
        }

        state.rules = state.rules.filter(r => r.id != id);
        renderAll();
        toast(`✅ Đã xóa quy định "${rule.text}"`);
    }
};

// Hàm xóa chức vụ
window.removeOfficerRole = async function(id) {
    const state = getState();
    const officer = state.officers.find(o => o.id == id);
    if (!officer) return;

    if (confirm(`Xóa chức vụ ${officer.role}?`)) {
        const { error } = await supabase
            .from('officers')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(error);
            toast('❌ Lỗi xóa: ' + error.message);
            return;
        }

        state.officers = state.officers.filter(o => o.id != id);
        renderAll();
        toast(`✅ Đã xóa chức vụ ${officer.role}`);
    }
};

// Cập nhật trạng thái điểm danh (Chỉ cập nhật UI, chưa lưu DB vội)
window.setAtt = function(dateStr, studentId, session, status) {
    const state = getState();
    if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
    if (!state.attendance[dateStr][studentId]) state.attendance[dateStr][studentId] = { morning: '', afternoon: '', morningNote: '', afternoonNote: '' };
    
    state.attendance[dateStr][studentId][session] = status;
    // Chỉ cập nhật UI, không lưu DB ngay lập tức. Khi bấm "Lưu điểm danh" sẽ lưu.
    // QUAN TRỌNG: phải render lại thì nút mới đổi màu "on" và thấy được thay đổi ngay,
    // trước đây chỗ này chỉ đổi dữ liệu trong bộ nhớ mà không vẽ lại UI.
    renderAttendance();
};

// Cập nhật ghi chú điểm danh
window.setAttNote = function(dateStr, studentId, noteField, value) {
    const state = getState();
    if (state.attendance[dateStr] && state.attendance[dateStr][studentId]) {
        state.attendance[dateStr][studentId][noteField] = value;
    }
    // Không cần render lại toàn bộ ở đây (sẽ làm mất focus khi đang gõ),
    // giá trị input đã tự hiển thị đúng những gì người dùng gõ.
};

console.log('events.js đã load và sẵn sàng');