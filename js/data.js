// data.js
import { supabase } from './supabase-client.js';
import { todayISO } from './utils.js';

let state = null;

export async function loadState() {
    console.log('🔄 Đang load dữ liệu từ Supabase...');
    try {
        // Lấy class id = 1
        const { data: classData, error: classError } = await supabase
            .from('classes')
            .select('*')
            .eq('id', 1)
            .single();

        if (classError) throw classError;
        console.log('✅ Lớp học:', classData);

        // Lấy học sinh
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('class_id', 1);

        if (studentsError) throw studentsError;
        console.log('✅ Học sinh:', students.length);

        // Lấy rules
        const { data: rules, error: rulesError } = await supabase
            .from('rules')
            .select('*')
            .eq('class_id', 1);

        if (rulesError) throw rulesError;

        // Lấy officers
        const { data: officers, error: officersError } = await supabase
            .from('officers')
            .select('*')
            .eq('class_id', 1);

        if (officersError) throw officersError;

        // Lấy logs
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .select('*')
            .eq('class_id', 1);

        if (logsError) throw logsError;

        // Lấy attendance
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
                password: classData.password_hash,
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

        console.log('✅ State đã được load:', state);
        return true;
    } catch (error) {
        console.error('❌ Lỗi load dữ liệu:', error);
        return false;
    }
}

export function getState() { return state; }
window.getState = getState;