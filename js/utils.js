// Các hàm tiện ích
export function pad(n) { return n < 10 ? '0' + n : '' + n; }

export function fmtDate(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
}

export function initials(name) {
    const parts = name.trim().split(' ');
    return (parts[parts.length - 2]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
}

export function dateFromISO(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function diffDays(a, b) {
    return Math.round((a - b) / 86400000);
}

export function isoOf(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

export function todayISO() {
    return isoOf(new Date());
}

export function levelOf(pts) {
    if (pts >= 130) return { name: 'Cây toả bóng', emoji: '🌳', next: null };
    if (pts >= 110) return { name: 'Hoa rực rỡ', emoji: '🌺', next: 130 };
    if (pts >= 90) return { name: 'Hoa nở', emoji: '🌸', next: 110 };
    if (pts >= 70) return { name: 'Cây xanh', emoji: '🌿', next: 90 };
    if (pts >= 40) return { name: 'Mầm non', emoji: '🌾', next: 70 };
    return { name: 'Hạt giống', emoji: '🌱', next: 40 };
}

// Các hàm liên quan đến tuần
export function currentWeekNumber(state) {
    const start = dateFromISO(state.classInfo.week1Start);
    const step = (new Date(state.classInfo.week2Start) - new Date(state.classInfo.week1Start)) / 86400000 || 7;
    const diff = diffDays(new Date(), start);
    if (diff < 0) return 0;
    return Math.floor(diff / step) + 1;
}

export function weekRange(state, wk) {
    const start = dateFromISO(state.classInfo.week1Start);
    const step = (new Date(state.classInfo.week2Start) - new Date(state.classInfo.week1Start)) / 86400000 || 7;
    const s = new Date(start);
    s.setDate(s.getDate() + (wk - 1) * step);
    const e = new Date(s);
    e.setDate(e.getDate() + step - 1);
    return { start: s, end: e };
}