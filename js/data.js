import { supabase } from './supabase-client.js';
import { todayISO } from './utils.js';

let state = null;

// Load dữ liệu từ Supabase
export async function loadState() {
    try {
        // 1. Lấy class (giả sử id = 1)
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('id', 1)
            .single();

        if (classError) throw classError;
        if (!classData) throw new Error('Không tìm thấy lớp học');

        // 2. Lấy students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', 1);

        if (studentsError) throw studentsError;

        // 3. Lấy rules
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*')
            .eq('class_id', 1);

        if (rulesError) throw rulesError;

        // 4. Lấy officers
        const { data: officers, error: officersError } = await supabase
            .from('officers')
            .select('*')
            .eq('class_id', 1);

        if (officersError) throw officersError;

        // 5. Lấy logs
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .select('*')
            .eq('class_id', 1);

        if (logsError) throw logsError;

        // 6. Lấy attendance
        const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('class_id', 1);

        if (attendanceError) throw attendanceError;

        // Chuyển attendance về dạng object
        const attendance = {};
        attendanceData.forEach(row => {
            const date = row.date;
            if (!attendance[date]) attendance[date] = {};
            attendance[date][row.student_id] = {
                morning: row.morning_status || '',
                afternoon: row.afternoon_status || '',
                morningNote: row.morning_note || '',
                afternoonNote: row.afternoon_note || '',
            };
        });

        // Gán state
        state = {
            classInfo: {
                id: classData.id,
                school: classData.school,
                className: classData.class_name,
                teacher: classData.teacher,
                schoolYear: classData.school_year,
                week1Start: classData.week1_start,
                week2Start: classData.week2_start,
                totalWeeks: classData.total_weeks,
                hk1Weeks: classData.hk1_weeks,
                numGroups: classData.num_groups,
                password: classData.password_hash, // hash
            },
            students: students.map(s => ({
                id: s.id,
                name: s.name,
                group: s.group_number,
                joinDate: s.join_date,
            })),
            rules: rules.map(r => ({
                id: r.id,
                group: r.rule_group,
                icon: r.icon,
                text: r.text,
                desc: r.description,
                points: r.points,
                teacherInput: r.teacher_input,
            })),
            officers: officers.map(o => ({
                id: o.id,
                role: o.role_name,
                studentId: o.student_id,
            })),
            logs: logs.map(l => ({
                id: l.id,
                studentId: l.student_id,
                date: l.date,
                ruleId: l.rule_id,
                ruleText: l.rule_text,
                points: l.points,
                timestamp: l.timestamp,
            })),
            attendance: attendance,
        };

        return true;
    } catch (error) {
        console.error('Lỗi tải dữ liệu:', error);
        return false;
    }
}

export function getState() { return state; }

// --- Các hàm thao tác dữ liệu (gọi API) ---

// Ghi nhận điểm (thêm log)
export async function addLog(studentId, ruleId, ruleText, points) {
    const newLog = {
        class_id: 1,
        student_id: studentId,
        date: todayISO(),
        rule_id: ruleId || null,
        rule_text: ruleText,
        points: points,
        timestamp: Date.now(),
    };
    const { data, error } = await supabase
        .from('logs')
        .insert([newLog])
        .select();

    if (error) throw error;

    const inserted = data[0];
    state.logs.push({
        id: inserted.id,
        studentId: inserted.student_id,
        date: inserted.date,
        ruleId: inserted.rule_id,
        ruleText: inserted.rule_text,
        points: inserted.points,
        timestamp: inserted.timestamp,
    });
    return inserted;
}

// Cập nhật điểm danh
export async function updateAttendance(dateStr, studentId, field, value) {
    const updateData = {};
    if (field === 'morning') updateData.morning_status = value;
    else if (field === 'afternoon') updateData.afternoon_status = value;
    else if (field === 'morningNote') updateData.morning_note = value;
    else if (field === 'afternoonNote') updateData.afternoon_note = value;

    const { data: existing, error: checkError } = await supabase
        .from('attendance')
        .select('id')
        .eq('class_id', 1)
        .eq('student_id', studentId)
        .eq('date', dateStr)
        .maybeSingle();

    if (checkError) throw checkError;

    let result;
    if (existing) {
        const { data, error } = await supabase
            .from('attendance')
            .update(updateData)
            .eq('id', existing.id)
            .select();
        if (error) throw error;
        result = data[0];
    } else {
        const newRow = {
            class_id: 1,
            student_id: studentId,
            date: dateStr,
            morning_status: '',
            afternoon_status: '',
            morning_note: '',
            afternoon_note: '',
            ...updateData,
        };
        const { data, error } = await supabase
            .from('attendance')
            .insert([newRow])
            .select();
        if (error) throw error;
        result = data[0];
    }

    // Cập nhật state
    if (!state.attendance[dateStr]) state.attendance[dateStr] = {};
    if (!state.attendance[dateStr][studentId]) {
        state.attendance[dateStr][studentId] = { morning: '', afternoon: '', morningNote: '', afternoonNote: '' };
    }
    if (field === 'morning') state.attendance[dateStr][studentId].morning = value;
    else if (field === 'afternoon') state.attendance[dateStr][studentId].afternoon = value;
    else if (field === 'morningNote') state.attendance[dateStr][studentId].morningNote = value;
    else if (field === 'afternoonNote') state.attendance[dateStr][studentId].afternoonNote = value;

    return result;
}

// Thêm học sinh
export async function addStudent(name, group) {
    const newStudent = {
        class_id: 1,
        name: name,
        group_number: group,
        join_date: todayISO(),
    };
    const { data, error } = await supabase
        .from('students')
        .insert([newStudent])
        .select();
    if (error) throw error;
    const inserted = data[0];
    state.students.push({
        id: inserted.id,
        name: inserted.name,
        group: inserted.group_number,
        joinDate: inserted.join_date,
    });
    return inserted;
}

// Xóa học sinh
export async function removeStudent(studentId) {
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId)
        .eq('class_id', 1);
    if (error) throw error;
    state.students = state.students.filter(s => s.id !== studentId);
    state.logs = state.logs.filter(l => l.studentId !== studentId);
    for (const date in state.attendance) {
        delete state.attendance[date][studentId];
    }
}

// Cập nhật nhóm học sinh
export async function updateStudentGroup(studentId, newGroup) {
    const { error } = await supabase
        .from('students')
        .update({ group_number: newGroup })
        .eq('id', studentId)
        .eq('class_id', 1);
    if (error) throw error;
    const student = state.students.find(s => s.id === studentId);
    if (student) student.group = newGroup;
}

// Thêm quy định
export async function addRule(ruleData) {
    const newRule = {
        class_id: 1,
        rule_group: ruleData.group,
        icon: ruleData.icon,
        text: ruleData.text,
        description: ruleData.desc || '',
        points: ruleData.points,
        teacher_input: ruleData.teacherInput || false,
    };
    const { data, error } = await supabase
        .from('rules')
        .insert([newRule])
        .select();
    if (error) throw error;
    const inserted = data[0];
    state.rules.push({
        id: inserted.id,
        group: inserted.rule_group,
        icon: inserted.icon,
        text: inserted.text,
        desc: inserted.description,
        points: inserted.points,
        teacherInput: inserted.teacher_input,
    });
    return inserted;
}

// Cập nhật quy định
export async function updateRule(ruleId, ruleData) {
    const update = {
        rule_group: ruleData.group,
        icon: ruleData.icon,
        text: ruleData.text,
        description: ruleData.desc || '',
        points: ruleData.points,
        teacher_input: ruleData.teacherInput || false,
    };
    const { error } = await supabase
        .from('rules')
        .update(update)
        .eq('id', ruleId)
        .eq('class_id', 1);
    if (error) throw error;
    const rule = state.rules.find(r => r.id === ruleId);
    if (rule) {
        rule.group = ruleData.group;
        rule.icon = ruleData.icon;
        rule.text = ruleData.text;
        rule.desc = ruleData.desc;
        rule.points = ruleData.points;
        rule.teacherInput = ruleData.teacherInput;
    }
}

// Xóa quy định
export async function deleteRule(ruleId) {
    const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId)
        .eq('class_id', 1);
    if (error) throw error;
    state.rules = state.rules.filter(r => r.id !== ruleId);
}

// Cập nhật officers
export async function updateOfficer(officerId, studentId) {
    const { error } = await supabase
        .from('officers')
        .update({ student_id: studentId })
        .eq('id', officerId)
        .eq('class_id', 1);
    if (error) throw error;
    const officer = state.officers.find(o => o.id === officerId);
    if (officer) officer.studentId = studentId;
}

// Thêm chức vụ mới
export async function addOfficerRole(roleName) {
    const newOfficer = {
        class_id: 1,
        role_name: roleName,
        student_id: null,
    };
    const { data, error } = await supabase
        .from('officers')
        .insert([newOfficer])
        .select();
    if (error) throw error;
    const inserted = data[0];
    state.officers.push({
        id: inserted.id,
        role: inserted.role_name,
        studentId: inserted.student_id,
    });
    return inserted;
}

// Xóa chức vụ
export async function deleteOfficerRole(officerId) {
    const { error } = await supabase
        .from('officers')
        .delete()
        .eq('id', officerId)
        .eq('class_id', 1);
    if (error) throw error;
    state.officers = state.officers.filter(o => o.id !== officerId);
}

// Cập nhật thông tin lớp
export async function updateClassInfo(classInfo) {
    const update = {
        school: classInfo.school,
        class_name: classInfo.className,
        teacher: classInfo.teacher,
        school_year: classInfo.schoolYear,
        week1_start: classInfo.week1Start,
        week2_start: classInfo.week2Start,
        total_weeks: classInfo.totalWeeks,
        hk1_weeks: classInfo.hk1Weeks,
        num_groups: classInfo.numGroups,
    };
    if (classInfo.password) {
        update.password_hash = classInfo.password; // Cần hash trước khi lưu
    }
    const { error } = await supabase
        .from('classes')
        .update(update)
        .eq('id', 1);
    if (error) throw error;
    Object.assign(state.classInfo, classInfo);
}

// Xóa toàn bộ log
export async function clearAllLogs() {
    const { error } = await supabase
        .from('logs')
        .delete()
        .eq('class_id', 1);
    if (error) throw error;
    state.logs = [];
}