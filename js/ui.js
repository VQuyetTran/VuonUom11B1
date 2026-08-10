// js/ui.js
// Các hàm render giao diện và tiện ích UI (toast, modal, download...)

// =========================================================
// Toast
// =========================================================
function toast(msg, allowUndo) {
  const wrap = document.getElementById("toast-wrap");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = "<span>" + msg + "</span>" + (allowUndo ? "<button data-undo='1'>HOÀN TÁC</button>" : "");
  wrap.appendChild(el);
  if (allowUndo) {
    el.querySelector("[data-undo]").addEventListener("click", () => { undoLast();
      el.remove(); });
  }
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 300);
  }, 4500);
}

// =========================================================
// Modal
// =========================================================
function openModal(id) { document.getElementById(id).classList.add("show"); }
function closeModal(id) { document.getElementById(id).classList.remove("show"); }

function initModalCloseEvents() {
  document.querySelectorAll("[data-close]").forEach(b => {
    b.addEventListener("click", () => closeModal(b.getAttribute("data-close")));
  });
  document.querySelectorAll(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("show"); });
  });
}

// =========================================================
// Download file
// =========================================================
function downloadFile(filename, content, mime) {
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url);
    a.remove(); }, 200);
}

// =========================================================
// Render: Stats Bar
// =========================================================
function renderStatsBar() {
  const bar = document.getElementById("statsBar");
  const students = DB.students;
  const totalPoints = students.reduce((s, x) => s + x.points, 0);
  const highLevelCount = students.filter(s => getLevel(s.points).threshold >= 150).length;
  let leader = students.reduce((a, b) => (b.points > (a ? a.points : -1) ? b : a), null);
  const teamTotals = teamAggregates();
  let leadTeam = teamTotals.reduce((a, b) => (b.total > (a ? a.total : -1) ? b : a), null);
  const wk = currentWeekNumber();
  bar.innerHTML = [
    chip(students.length, "Tổng số học sinh"),
    chip(DB.numTeams, "Tổng số tổ"),
    chip(totalPoints, "Tổng điểm cả lớp"),
    chip(highLevelCount, "HS đạt cấp độ cao"),
    chip(leader ? displayName(leader.name) : "—", "Học sinh dẫn đầu"),
    chip(leadTeam ? "Tổ " + leadTeam.team : "—", "Tổ dẫn đầu"),
    chip(wk > 0 ? "Tuần " + wk : "Chưa bắt đầu", "Tuần học hiện tại")
  ].join("");
}
function chip(v, l) { return '<div class="stat-chip"><div class="v">' + v + '</div><div class="l">' + l + '</div></div>'; }

// =========================================================
// Render: Sidebar Summary
// =========================================================
function renderSideSummary() {
  const wk = currentWeekNumber();
  const box = document.getElementById("sideSummary");
  if (wk <= 0) {
    box.innerHTML = '<div class="trophy">🏆</div><h4>Thi đua chưa bắt đầu</h4><div class="dates">Bắt đầu ngày ' + fmtDate(dateFromISO(DB.week1Start)) + '</div>';
    return;
  }
  const r = weekRange(wk);
  const today = new Date();
  let dayOf = diffDays(new Date(today.getFullYear(), today.getMonth(), today.getDate()), r.start) + 1;
  dayOf = Math.max(1, Math.min(7, dayOf));
  box.innerHTML =
    '<div class="trophy">🏆</div><h4>Thi đua tuần ' + wk + '</h4>' +
    '<div class="dates">' + fmtDate(r.start) + ' – ' + fmtDate(r.end) + '</div>' +
    '<div class="progressline"><i style="width:' + (dayOf / 7 * 100) + '%"></i></div>' +
    '<div class="dayof">Ngày ' + dayOf + ' / 7</div>';
}

// =========================================================
// Render: Garden (Khu vườn)
// =========================================================
function populateTeamFilterOptions() {
  const sel = document.getElementById("filterTeam");
  sel.innerHTML = '<option value="all">Tất cả các tổ</option>' +
    Array.from({ length: DB.numTeams }, (_, i) => i + 1).map(t => '<option value="' + t + '">Tổ ' + t + '</option>').join("");
  const selLog = document.getElementById("logFilterTeam");
  selLog.innerHTML = '<option value="all">Tất cả các tổ</option>' +
    Array.from({ length: DB.numTeams }, (_, i) => i + 1).map(t => '<option value="' + t + '">Tổ ' + t + '</option>').join("");
  const selLogS = document.getElementById("logFilterStudent");
  selLogS.innerHTML = '<option value="all">Tất cả học sinh</option>' +
    DB.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')).map(s => '<option value="' + s.id + '">' + s.name + '</option>').join("");
}

function currentGardenList() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const teamF = document.getElementById("filterTeam").value;
  const sortV = document.getElementById("sortSelect").value;
  let list = DB.students.filter(s => {
    const matchName = !q || s.name.toLowerCase().includes(q);
    const matchTeam = teamF === "all" || s.team === Number(teamF);
    return matchName && matchTeam;
  });
  if (sortV === "name") list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  else if (sortV === "points_desc") list.sort((a, b) => b.points - a.points);
  else if (sortV === "points_asc") list.sort((a, b) => a.points - b.points);
  else if (sortV === "team") list.sort((a, b) => a.team - b.team || a.name.localeCompare(b.name, 'vi'));
  return list;
}

function renderGarden() {
  const grid = document.getElementById("gardenGrid");
  const list = currentGardenList();
  const ranks = rankMapByPoints();
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-hint">Không tìm thấy học sinh phù hợp với bộ lọc hiện tại.</div>';
    return;
  }
  grid.innerHTML = list.map(s => {
    const lvl = getLevel(s.points);
    const prog = levelProgress(s.points);
    const badges = studentBadges(s);
    return '<div class="s-card">' +
      '<div class="rank-badge">#' + ranks[s.id] + '</div>' +
      '<div class="team-tag" style="background:' + teamColor(s.team) + '">Tổ ' + s.team + '</div>' +
      '<div class="plant">' + lvl.icon + '</div>' +
      '<div class="sname">' + displayName(s.name) + '</div>' +
      '<div class="level-name">' + lvl.name + '</div>' +
      '<div class="points">' + s.points + ' <span>điểm</span></div>' +
      '<div class="progressline"><i style="width:' + prog.pct + '%"></i></div>' +
      '<div class="next-lvl">' + (prog.nextName ? "Còn " + prog.remain + " điểm đến cấp '" + prog.nextName + "'" : "Đã đạt cấp cao nhất") + '</div>' +
      '<div class="badges-row">' + badges.map(b => '<span class="badge-ic" title="' + b.name + '">' + b.icon + '</span>').join("") + '</div>' +
      '<div class="cardbtns">' +
      '<button class="btn primary teacher-only" onclick="AppUI.openPoint(\'' + s.id + '\')">+ Ghi nhận điểm</button>' +
      '<button class="btn outline" onclick="AppUI.openDetail(\'' + s.id + '\')">Chi tiết</button>' +
      '</div>' +
      '</div>';
  }).join("");
  updateUIByRole();
}

// =========================================================
// Render: Teams
// =========================================================
function renderTeams() {
  const teamGrid = document.getElementById("teamSummaryGrid");
  const agg = teamAggregates();
  teamGrid.innerHTML = agg.map(t => {
    return '<div class="team-card" style="border-top-color:' + teamColor(t.team) + '">' +
      '<h3>Tổ ' + t.team + '</h3>' +
      '<div class="cnt">Sĩ số: ' + t.members.length + ' học sinh</div>' +
      '<div class="tp">' + t.total + ' điểm</div>' +
      '<div style="font-size:11px;color:var(--text-light);margin-top:4px;">Trung bình: ' + t.avg + ' điểm/HS</div>' +
      '</div>';
  }).join("");

  const body = document.getElementById("rosterBody");
  const list = DB.students.slice().sort((a, b) => a.team - b.team || a.name.localeCompare(b.name, 'vi'));
  body.innerHTML = list.map((s, idx) => {
    let options = "";
    for (let t = 1; t <= DB.numTeams; t++) { options += '<option value="' + t + '" ' + (t === s.team ? "selected" : "") + '>Tổ ' + t + '</option>'; }
    return '<tr><td>' + (idx + 1) + '</td><td>' + s.name + '</td><td>Tổ ' + s.team + '</td><td>' + s.points + '</td>' +
      '<td><select class="team-select teacher-only" onchange="AppUI.doTransfer(\'' + s.id + '\', this.value)">' + options + '</select></td></tr>';
  }).join("");
  updateUIByRole();
}

// =========================================================
// Render: Ranking
// =========================================================
let currentRankTab = "personal";

function renderRanking() {
  const ranks = rankMapByPoints();
  const tbody = document.querySelector("#rankPersonalTable tbody");
  if (DB.students.every(s => s.points === 0)) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-light);padding:20px;">Lớp chưa phát sinh điểm nào.</td></tr>';
  } else {
    const sorted = DB.students.slice().sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, 'vi'));
    tbody.innerHTML = sorted.map(s => {
      const lvl = getLevel(s.points);
      const badges = studentBadges(s);
      const r = ranks[s.id];
      const medal = r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : "";
      return '<tr><td>' + medal + ' #' + r + '</td><td>' + displayName(s.name) + '</td><td>Tổ ' + s.team + '</td><td><b>' + s.points + '</b></td>' +
        '<td>' + lvl.icon + ' ' + lvl.name + '</td><td>' + badges.map(b => b.icon).join(" ") + '</td></tr>';
    }).join("");
  }

  const agg = teamAggregates();
  const sortedTeams = agg.slice().sort((a, b) => b.total - a.total);
  let rank = 0,
    prev = null,
    seen = 0;
  const teamRanks = {};
  sortedTeams.forEach(t => { seen++; if (t.total !== prev) { rank = seen;
      prev = t.total; }
    teamRanks[t.team] = rank; });
  const teamBody = document.getElementById("rankTeamBody");
  teamBody.innerHTML = sortedTeams.map(t => {
    if (t.members.length === 0) {
      return '<tr><td>—</td><td>Tổ ' + t.team + '</td><td>0</td><td>0</td><td>0</td><td style="color:var(--text-light);">Tổ chưa có thành viên</td></tr>';
    }
    const top = t.members.slice().sort((a, b) => b.points - a.points)[0];
    const r = teamRanks[t.team];
    const medal = r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : "";
    return '<tr><td>' + medal + ' #' + r + '</td><td>Tổ ' + t.team + '</td><td>' + t.members.length + '</td><td><b>' + t.total + '</b></td><td>' + t.avg + '</td><td>' + displayName(top.name) + '</td></tr>';
  }).join("");

  document.getElementById("rankPersonalTable").parentElement.style.display = currentRankTab === "personal" ? "block" : "none";
  document.getElementById("rankTeamWrap").style.display = currentRankTab === "team" ? "block" : "none";
}

// =========================================================
// Render: Rules
// =========================================================
function renderRules() {
  const map = { daily: "rules-daily", achieve: "rules-achieve", special: "rules-special", minor: "rules-minor", medium: "rules-medium", serious: "rules-serious" };
  Object.keys(map).forEach(g => {
    const el = document.getElementById(map[g]);
    const rules = POINT_RULES.filter(r => r.group === g);
    el.innerHTML = rules.map(r => {
      const cls = r.points > 0 ? "plus" : "minus";
      return '<div class="rule-row"><span>' + r.label + '</span><span class="rule-pts ' + cls + '">' + (r.points > 0 ? "+" : "") + r.points + '</span></div>';
    }).join("");
  });
  const bList = document.getElementById("badgeConfigList");
  bList.innerHTML = BADGE_CONFIG.map(b => {
    return '<div class="rule-row"><span>' + b.icon + ' <b>' + b.name + '</b> — ' + b.desc + '</span></div>';
  }).join("");
}

// =========================================================
// Render: Log
// =========================================================
function renderLog() {
  const stF = document.getElementById("logFilterStudent").value;
  const teamF = document.getElementById("logFilterTeam").value;
  const typeF = document.getElementById("logFilterType").value;
  const from = document.getElementById("logFilterFrom").value;
  const to = document.getElementById("logFilterTo").value;
  const order = document.getElementById("logSortOrder").value;

  let list = DB.logs.filter(l => {
    if (stF !== "all" && l.studentId !== stF) return false;
    if (teamF !== "all" && String(l.team) !== teamF) return false;
    if (typeF !== "all" && l.type !== typeF) return false;
    if (from && l.dateISO < from) return false;
    if (to && l.dateISO > to) return false;
    return true;
  });
  list = list.slice();
  if (order === "asc") list.reverse();

  const listEl = document.getElementById("logList");
  if (list.length === 0) {
    listEl.innerHTML = '<div class="empty-hint">Không có sự kiện nào phù hợp.</div>';
    return;
  }
  listEl.innerHTML = list.map(l => {
    const typeLabel = l.type === "plus" ? "CỘNG ĐIỂM" : l.type === "minus" ? "TRỪ ĐIỂM" : l.type === "transfer" ? "CHUYỂN TỔ" : "TỔNG KẾT";
    const ptsCls = l.points > 0 ? "plus" : l.points < 0 ? "minus" : "";
    const undoBtn = (l.type === "plus" || l.type === "minus" || (l.type === "transfer" && l.oldTeam)) ?
      '<button class="btn small outline teacher-only" style="margin-top:6px;" onclick="AppUI.undoOne(\'' + l.id + '\')">↺ Hoàn tác</button>' : "";
    return '<div class="log-item"><div class="l-left">' +
      '<span class="log-tag">' + typeLabel + '</span><span class="l-name">' + (l.studentName || "—") + '</span>' +
      (l.team ? ' <span style="color:var(--text-light);font-size:11px;">(Tổ ' + l.team + ')</span>' : '') +
      '<div class="l-meta">' + l.content + (l.note ? " — " + l.note : "") + '</div>' +
      undoBtn +
      '</div><div class="l-right">' + (l.points !== 0 ? '<div class="l-pts ' + ptsCls + '">' + (l.points > 0 ? "+" : "") + l.points + '</div>' : '') +
      '<div class="l-time">' + l.time + ' · ' + l.actor + '</div></div></div>';
  }).join("");
  updateUIByRole();
}

// =========================================================
// Render: Time & Summary
// =========================================================
let currentPeriodType = "week";
let currentPeriodData = null;

function renderTimeView() {
  const wk = currentWeekNumber();
  document.getElementById("currentWeekLabel").textContent = wk > 0 ?
    "Hiện đang ở Tuần " + wk + " (" + fmtDate(weekRange(wk).start) + " – " + fmtDate(weekRange(wk).end) + ")" :
    "Chưa bắt đầu — Tuần 1 khởi động ngày " + fmtDate(dateFromISO(DB.week1Start));
  renderPeriodSelectBox();
  renderSavedSummaries();
}

function renderPeriodSelectBox() {
  const box = document.getElementById("periodSelectBox");
  if (currentPeriodType === "week") {
    const wk = currentWeekNumber();
    const maxWeek = Math.max(wk, 35, 1);
    let opts = "";
    for (let i = 1; i <= maxWeek; i++) { opts += '<option value="' + i + '" ' + (i === wk ? "selected" : "") + '>Tuần ' + i + '</option>'; }
    box.innerHTML = '<label style="font-size:12px;color:var(--text-light);">Chọn tuần</label><br>' +
      '<select id="weekSelect" style="margin-top:6px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;">' + opts + '</select> ' +
      '<button class="btn primary" id="loadPeriodBtn" style="margin-left:8px;">Xem thống kê</button>';
  } else if (currentPeriodType === "month") {
    const now = new Date();
    const val = now.getFullYear() + "-" + pad(now.getMonth() + 1);
    box.innerHTML = '<label style="font-size:12px;color:var(--text-light);">Chọn tháng</label><br>' +
      '<input type="month" id="monthSelect" value="' + val + '" style="margin-top:6px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;"> ' +
      '<button class="btn primary" id="loadPeriodBtn" style="margin-left:8px;">Xem thống kê</button>';
  } else {
    box.innerHTML = '<label style="font-size:12px;color:var(--text-light);">Chọn học kì</label><br>' +
      '<select id="semSelect" style="margin-top:6px;padding:9px 12px;border:1px solid var(--border);border-radius:10px;">' +
      '<option value="hk1">' + SEMESTERS.hk1.label + ' (Tuần ' + SEMESTERS.hk1.start + '–' + SEMESTERS.hk1.end + ')</option>' +
      '<option value="hk2">' + SEMESTERS.hk2.label + ' (Tuần ' + SEMESTERS.hk2.start + '–' + SEMESTERS.hk2.end + ')</option>' +
      '</select> <button class="btn primary" id="loadPeriodBtn" style="margin-left:8px;">Xem thống kê</button>';
  }
  document.getElementById("loadPeriodBtn").addEventListener("click", loadPeriodStats);
  document.getElementById("periodStatsBox").style.display = "none";
}

function loadPeriodStats() {
  let fromISO, toISO, label;
  if (currentPeriodType === "week") {
    const wk = Number(document.getElementById("weekSelect").value);
    const r = weekRange(wk);
    fromISO = isoOf(r.start);
    toISO = isoOf(r.end);
    label = "Tuần " + wk + " (" + fmtDate(r.start) + " – " + fmtDate(r.end) + ")";
  } else if (currentPeriodType === "month") {
    const v = document.getElementById("monthSelect").value;
    const [y, m] = v.split("-").map(Number);
    const first = new Date(y, m - 1, 1),
      last = new Date(y, m, 0);
    fromISO = isoOf(first);
    toISO = isoOf(last);
    label = "Tháng " + m + "/" + y;
  } else {
    const sem = document.getElementById("semSelect").value;
    const s = SEMESTERS[sem];
    const r1 = weekRange(s.start),
      r2 = weekRange(s.end);
    fromISO = isoOf(r1.start);
    toISO = isoOf(r2.end);
    label = s.label + " (Tuần " + s.start + "–" + s.end + ")";
  }
  const logs = logsInRange(fromISO, toISO).filter(l => l.type === "plus" || l.type === "minus" || l.type === "transfer");
  const plusLogs = logs.filter(l => l.type === "plus");
  const minusLogs = logs.filter(l => l.type === "minus");
  const totalPlus = plusLogs.reduce((s, l) => s + l.points, 0);
  const totalMinus = minusLogs.reduce((s, l) => s + l.points, 0);
  const net = totalPlus + totalMinus;

  const studentNet = DB.students.map(s => {
    const n = logs.filter(l => l.studentId === s.id && (l.type === "plus" || l.type === "minus")).reduce((sum, l) => sum + l.points, 0);
    return { id: s.id, name: s.name, team: s.team, net: n };
  }).sort((a, b) => b.net - a.net);

  const teamNet = [];
  for (let t = 1; t <= DB.numTeams; t++) {
    const n = logs.filter(l => l.team === t && (l.type === "plus" || l.type === "minus")).reduce((sum, l) => sum + l.points, 0);
    teamNet.push({ team: t, net: n });
  }
  teamNet.sort((a, b) => b.net - a.net);

  currentPeriodData = { type: currentPeriodType, label, fromISO, toISO, totalLogs: logs.length, totalPlus, totalMinus, net, studentNet, teamNet };

  document.getElementById("periodMiniStats").innerHTML =
    miniStat(logs.length, "Tổng lượt ghi nhận") +
    miniStat("+" + totalPlus, "Tổng điểm cộng") +
    miniStat(totalMinus, "Tổng điểm trừ") +
    miniStat(net, "Điểm ròng");

  document.getElementById("periodStudentRank").innerHTML = studentNet.slice(0, 15).map((s, i) =>
    '<tr><td>#' + (i + 1) + '</td><td>' + displayName(s.name) + '</td><td>Tổ ' + s.team + '</td><td>' + s.net + '</td></tr>').join("") ||
    '<tr><td colspan="4" style="text-align:center;color:var(--text-light);">Không có dữ liệu trong khoảng thời gian này.</td></tr>';

  document.getElementById("periodTeamRank").innerHTML = teamNet.map((t, i) =>
    '<tr><td>#' + (i + 1) + '</td><td>Tổ ' + t.team + '</td><td>' + t.net + '</td></tr>').join("");

  document.getElementById("periodStatsBox").style.display = "block";
}

function miniStat(v, l) { return '<div><b>' + v + '</b><span>' + l + '</span></div>'; }

function renderSavedSummaries() {
  const box = document.getElementById("savedSummariesList");
  if (DB.summaries.length === 0) { box.innerHTML = '<div class="empty-hint">Chưa có bản tổng kết nào được lưu.</div>'; return; }
  box.innerHTML = DB.summaries.map(s => {
    return '<div class="saved-summary"><div><b>' + s.label + '</b><div style="font-size:11px;color:var(--text-light);">Lập ngày ' + s.createdAt + ' bởi ' + s.author + '</div></div>' +
      '<div style="display:flex;gap:6px;">' +
      '<button class="btn small outline" onclick="AppUI.viewSummary(\'' + s.id + '\')">Xem lại</button>' +
      '<button class="btn small danger teacher-only" onclick="AppUI.deleteSummary(\'' + s.id + '\')">Xóa</button>' +
      '</div></div>';
  }).join("");
  updateUIByRole();
}

// =========================================================
// Render All
// =========================================================
function renderAll() {
  populateTeamFilterOptions();
  renderStatsBar();
  renderSideSummary();
  renderGarden();
  renderTeams();
  renderRanking();
  renderRules();
  renderLog();
  renderTimeView();
  document.getElementById("dataVersionInfo").textContent =
    "Phiên bản dữ liệu: v" + DB.version + " · Tổng số sự kiện nhật ký: " + DB.logs.length + " · Bản tổng kết đã lưu: " + DB.summaries.length;
  document.getElementById("presentModeBtn").textContent = DB.presentMode ? "🎭 Đang trình chiếu (bật)" : "🎭 Chế độ trình chiếu";
  updateUIByRole();
}