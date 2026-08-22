// config.js
const STORAGE_KEY = 'vuon-uom-state-v3';
const APP_PASSWORD = 'admin123';

// Helper functions (không phụ thuộc state)
function pad(n) { return n < 10 ? '0' + n : '' + n; }

function fmtDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y;
}

function initials(name) {
  const parts = name.trim().split(' ');
  return (parts[parts.length - 2]?.[0] || '') + (parts[parts.length - 1]?.[0] || '');
}

function dateFromISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function diffDays(a, b) {
  return Math.round((a - b) / 86400000);
}

function isoOf(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
}

function todayISO() {
  return isoOf(new Date());
}

function levelOf(pts) {
  if (pts >= 130) return { name: 'Cây toả bóng', emoji: '🌳', next: null };
  if (pts >= 110) return { name: 'Hoa rực rỡ', emoji: '🌺', next: 130 };
  if (pts >= 90) return { name: 'Hoa nở', emoji: '🌸', next: 110 };
  if (pts >= 70) return { name: 'Cây xanh', emoji: '🌿', next: 90 };
  if (pts >= 40) return { name: 'Mầm non', emoji: '🌾', next: 70 };
  return { name: 'Hạt giống', emoji: '🌱', next: 40 };
}