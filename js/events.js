// js/events.js

let activeStudentId = null;
let selectedRuleId = null;

// ===== Modal point =====
function openPointModal(studentId) {
  // Kiểm tra quyền: nếu không phải giáo viên thì không mở modal
  if (!isTeacherMode) {
    toast("⚠️ Bạn cần đăng nhập với quyền giáo viên để thực hiện thao tác này.");
    return;
  }
  activeStudentId = studentId;
  selectedRuleId = null;
  const s = DB.students.find(x => x.id === studentId);
  if (!s) return;
  document.getElementById("pmName").textContent = s.name;
  document.getElementById("pmTeam").textContent = "Tổ " + s.team;
  document.getElementById("pmPoints").textContent = s.points + " điểm";
  document.getElementById("pmNote").value = "";
  const plus = POINT_RULES.filter(r => r.points > 0);
  const minus = POINT_RULES.filter(r => r.points < 0);
  document.getElementById("pmPlusRules").innerHTML = plus.map(r => ruleHtml(r)).join("");
  document.getElementById("pmMinusRules").innerHTML = minus.map(r => ruleHtml(r)).join("");
  document.querySelectorAll("#pmPlusRules .rule-pick, #pmMinusRules .rule-pick").forEach(el => {
    el.addEventListener("click", () => {
      document.querySelectorAll("#pmPlusRules .rule-pick, #pmMinusRules .rule-pick").forEach(x => x.classList.remove("selected", "minus-sel"));
      selectedRuleId = el.getAttribute("data-rid");
      const r = ruleById(selectedRuleId);
      el.classList.add("selected");
      if (r.points < 0) el.classList.add("minus-sel");
    });
  });
  openModal("pointModal");
}
function ruleHtml(r) {
  const cls = r.points > 0 ? "plus" : "minus";
  return '<div class="rule-pick" data-rid="' + r.id + '"><span>' + r.label + '</span><span class="rule-pts ' + cls + '">' + (r.points > 0 ? "+" : "") + r.points + '</span></div>';
}

// ===== Modal detail =====
function openDetailModal(studentId) {
  const s = DB.students.find(x => x.id === studentId);
  if (!s) return;
  activeStudentId = studentId;
  const lvl = getLevel(s.points);
  const prog = levelProgress(s.points);
  document.getElementById("dtName").textContent = s.name;
  document.getElementById("dtSub").textContent = "Tổ " + s.team + " · " + lvl.icon + " " + lvl.name;
  document.getElementById("dtPoints").textContent = s.points;
  document.getElementById("dtLevel").textContent = lvl.icon + " " + lvl.name;
  document.getElementById("dtProgressBar").style.width = prog.pct + "%";
  document.getElementById("dtNextLevel").textContent = prog.nextName ? "Còn " + prog.remain + " điểm để đạt cấp '" + prog.nextName + "'" : "Đã đạt cấp độ cao nhất";
  const badges = studentBadges(s);
  document.getElementById("dtBadges").innerHTML = badges.length ? badges.map(b => '<div class="detail-badge">' + b.icon + ' ' + b.name + '</div>').join("") : '<span style="font-size:12px;color:var(--text-light);">Chưa đạt huy hiệu nào</span>';
  const logs = DB.logs.filter(l => l.studentId === studentId).slice(0, 20);
  document.getElementById("dtLogHistory").innerHTML = logs.length ? logs.map(l => {
    const cls = l.points > 0 ? "plus" : l.points < 0 ? "minus" : "";
    return '<div class="detail-log-item"><b style="color:var(--' + (l.points > 0 ? "plus" : l.points < 0 ? "minus" : "text") + ');">' + (l.points !== 0 ? (l.points > 0 ? "+" : "") + l.points : "•") + '</b> ' + l.content + ' <span style="color:var(--text-light);">— ' + l.time + '</span></div>';
  }).join("") : '<span style="font-size:12px;color:var(--text-light);">Chưa có lịch sử.</span>';
  openModal("detailModal");
}

// ===== Xem / Xóa tổng kết =====
function viewSummary(id) {
  const s = DB.summaries.find(x => x.id === id);
  if (!s) return;
  document.getElementById("svTitle").textContent = s.label;
  document.getElementById("svSub").textContent = "Lập ngày " + s.createdAt + " bởi " + s.author;
  document.getElementById("svStats").innerHTML =
    miniStat(s.stats.totalLogs, "Lượt ghi nhận") + miniStat("+" + s.stats.totalPlus, "Điểm cộng") +
    miniStat(s.stats.totalMinus, "Điểm trừ") + miniStat(s.stats.net, "Điểm ròng");
  document.getElementById("svStudentRank").innerHTML = s.studentRank.slice(0, 15).map((x, i) =>
    (i + 1) + ". " + x.name + " (Tổ " + x.team + ") — " + x.net + " điểm<br>").join("");
  document.getElementById("svTeamRank").innerHTML = s.teamRank.map((x, i) =>
    (i + 1) + ". Tổ " + x.team + " — " + x.net + " điểm<br>").join("");
  document.getElementById("svComment").textContent = s.comment || "(Không có nhận xét)";
  openModal("summaryViewModal");
}
function deleteSummary(id) {
  if (!isTeacherMode) {
    toast("⚠️ Bạn cần đăng nhập với quyền giáo viên để xóa tổng kết.");
    return;
  }
  if (!confirm("Bạn có chắc muốn xóa bản tổng kết này? Thao tác không ảnh hưởng đến điểm và nhật ký.")) return;
  DB.summaries = DB.summaries.filter(s => s.id !== id);
  saveDB();
  renderSavedSummaries();
  toast("Đã xóa bản tổng kết.");
}

// ===== Khởi tạo tất cả sự kiện =====
function initEvents() {
  // --- Sự kiện đăng nhập ---
  document.getElementById("loginBtn").addEventListener("click", function() {
    if (isTeacherMode) {
      logout();
      return;
    }
    const pwd = prompt("Nhập mật khẩu giáo viên:");
    if (pwd !== null) {
      login(pwd);
    }
  });

  // --- Navigation & Sidebar ---
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const v = btn.getAttribute("data-view");
      document.querySelectorAll(".view").forEach(sec => sec.classList.remove("active"));
      document.getElementById("view-" + v).classList.add("active");
      if (window.innerWidth <= 900) { closeSidebar(); }
      if (v === "ranking") renderRanking();
      if (v === "time") renderTimeView();
      if (v === "log") renderLog();
    });
  });

  document.getElementById("hamburgerBtn").addEventListener("click", openSidebar);
  document.getElementById("sidebarOverlay").addEventListener("click", closeSidebar);

  function openSidebar() {
    document.getElementById("sidebarNav").classList.add("open");
    document.getElementById("sidebarOverlay").classList.add("show");
  }
  function closeSidebar() {
    document.getElementById("sidebarNav").classList.remove("open");
    document.getElementById("sidebarOverlay").classList.remove("show");
  }
  window.closeSidebar = closeSidebar;

  // --- Present mode ---
  document.getElementById("presentModeBtn").addEventListener("click", () => {
    DB.presentMode = !DB.presentMode;
    saveDB();
    document.getElementById("presentModeBtn").textContent = DB.presentMode ? "🎭 Đang trình chiếu (bật)" : "🎭 Chế độ trình chiếu";
    renderAll();
  });

  // --- Search / filter / sort ---
  document.getElementById("searchInput").addEventListener("input", renderGarden);
  document.getElementById("filterTeam").addEventListener("change", renderGarden);
  document.getElementById("sortSelect").addEventListener("change", renderGarden);

  // --- Log filters ---
  ["logFilterStudent", "logFilterTeam", "logFilterType", "logFilterFrom", "logFilterTo", "logSortOrder"].forEach(id => {
    document.getElementById(id).addEventListener("change", renderLog);
  });

  // --- Undo ---
  document.getElementById("undoLastLogBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    undoLast();
  });
  document.getElementById("undoTransferBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    undoLast();
  });

  // --- Even teams ---
  document.getElementById("evenTeamsBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    if (!confirm("Xếp đều lại tất cả học sinh vào " + DB.numTeams + " tổ theo thứ tự danh sách?")) return;
    evenlyDistributeTeams();
  });

  // --- Modal point confirm ---
  document.getElementById("pmConfirmBtn").addEventListener("click", function() {
    if (!isTeacherMode) {
      toast("⚠️ Bạn cần đăng nhập với quyền giáo viên.");
      return;
    }
    if (!activeStudentId) { toast("Vui lòng chọn học sinh."); return; }
    if (!selectedRuleId) { toast("Vui lòng chọn một hành vi trước khi xác nhận."); return; }
    const s = DB.students.find(x => x.id === activeStudentId);
    const rule = ruleById(selectedRuleId);
    const note = document.getElementById("pmNote").value.trim();
    addPointLog(s, rule, note);
    closeModal("pointModal");
    toast("✓ Đã " + (rule.points > 0 ? "cộng " : "trừ ") + Math.abs(rule.points) + " điểm cho " + s.name, true);
    renderAll();
  });

  // --- Detail modal: ghi nhận điểm ---
  document.getElementById("dtGhiNhanBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    closeModal("detailModal");
    openPointModal(activeStudentId);
  });

  // --- Rank tabs ---
  document.querySelectorAll(".rank-tabs button").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".rank-tabs button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      currentRankTab = b.getAttribute("data-rank");
      renderRanking();
    });
  });

  // --- Time tabs ---
  document.querySelectorAll(".time-tabs button").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll(".time-tabs button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      currentPeriodType = b.getAttribute("data-period");
      renderPeriodSelectBox();
    });
  });

  // --- Save summary ---
  document.getElementById("saveSummaryBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    if (!currentPeriodData) { toast("Vui lòng chọn thời gian và xem thống kê trước."); return; }
    const comment = document.getElementById("periodComment").value.trim();
    const summary = {
      id: uid(),
      type: currentPeriodData.type,
      label: currentPeriodData.label,
      fromISO: currentPeriodData.fromISO,
      toISO: currentPeriodData.toISO,
      createdAt: nowDateTimeStr(),
      author: DB.classInfo.teacher,
      stats: { totalLogs: currentPeriodData.totalLogs, totalPlus: currentPeriodData.totalPlus, totalMinus: currentPeriodData.totalMinus, net: currentPeriodData.net },
      studentRank: currentPeriodData.studentNet,
      teamRank: currentPeriodData.teamNet,
      comment: comment
    };
    DB.summaries.unshift(summary);
    const log = {
      id: uid(),
      studentId: "",
      studentName: "",
      team: 0,
      type: "summary",
      content: "Lập bản tổng kết: " + summary.label,
      points: 0,
      note: comment,
      dateISO: todayISO(),
      time: nowDateTimeStr(),
      actor: DB.classInfo.teacher
    };
    DB.logs.unshift(log);
    saveDB();
    toast("Đã lưu bản tổng kết.");
    renderSavedSummaries();
    renderLog();
  });

  document.getElementById("printPeriodBtn").addEventListener("click", () => window.print());
  document.getElementById("csvPeriodBtn").addEventListener("click", () => {
    if (!currentPeriodData) { toast("Vui lòng xem thống kê trước khi xuất."); return; }
    let csv = "Hạng,Họ tên,Tổ,Điểm ròng\n";
    currentPeriodData.studentNet.forEach((s, i) => { csv += (i + 1) + ",\"" + s.name + "\",Tổ " + s.team + "," + s.net + "\n"; });
    downloadFile("tongket_" + currentPeriodData.label.replace(/\s+/g, "_") + ".csv", csv);
  });

  // --- Backup / Restore / CSV / Print / Reset ---
  document.getElementById("backupBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    downloadFile("VuonUomHanhPhuc_10/5_backup_" + todayISO() + ".json", JSON.stringify(DB, null, 2), "application/json");
    toast("Đã tải file sao lưu JSON.");
  });

  document.getElementById("restoreInput").addEventListener("change", function(e) {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.students)) { toast("File không hợp lệ."); return; }
        if (!confirm("Khôi phục sẽ THAY THẾ toàn bộ dữ liệu hiện tại bằng dữ liệu trong file. Bạn có chắc chắn?")) return;
        DB = parsed;
        if (!DB.summaries) DB.summaries = [];
        if (!DB.logs) DB.logs = [];
        saveDB();
        toast("Khôi phục dữ liệu thành công.");
        renderAll();
      } catch (err) { toast("Không đọc được file JSON."); }
    };
    reader.readAsText(file);
    e.target.value = "";
  });

  document.getElementById("csvStudentsBtn").addEventListener("click", () => {
    let csv = "Họ tên,Tổ,Điểm,Cấp độ\n";
    DB.students.forEach(s => { csv += "\"" + s.name + "\",Tổ " + s.team + "," + s.points + ",\"" + getLevel(s.points).name + "\"\n"; });
    downloadFile("danhsach_10/5.csv", csv);
  });

  document.getElementById("csvLogsBtn").addEventListener("click", () => {
    let csv = "Thời gian,Học sinh,Tổ,Loại,Nội dung,Điểm,Ghi chú,Người thực hiện\n";
    DB.logs.forEach(l => {
      csv += [l.time, l.studentName, l.team, l.type, '"' + l.content + '"', l.points, '"' + (l.note || "") + '"', l.actor].join(",") + "\n";
    });
    downloadFile("nhatky_10/5.csv", csv);
  });

  document.getElementById("printAllBtn").addEventListener("click", () => window.print());

  document.getElementById("resetDataBtn").addEventListener("click", function() {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    const phrase = "XOA DU LIEU";
    const input = prompt("Thao tác này sẽ XÓA TOÀN BỘ dữ liệu (điểm, nhật ký, tổng kết) và không thể khôi phục nếu chưa sao lưu.\nGõ chính xác cụm từ: " + phrase + " để xác nhận.");
    if (input !== phrase) { toast("Đã hủy — cụm xác nhận không khớp."); return; }
    DB = buildInitialData();
    saveDB();
    toast("Đã đặt lại toàn bộ dữ liệu về trạng thái ban đầu.");
    renderAll();
  });
}

// Expose global handlers
window.AppUI = {
  openPoint: openPointModal,
  openDetail: openDetailModal,
  doTransfer: (id, val) => {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    const s = DB.students.find(x => x.id === id);
    const t = Number(val);
    if (!s) return;
    transferStudent(s, t);
    toast("Đã chuyển " + s.name + " sang Tổ " + t + ".", true);
    renderAll();
  },
  undoOne: (logId) => {
    if (!isTeacherMode) { toast("⚠️ Cần quyền giáo viên."); return; }
    undoSpecificLog(logId);
  },
  viewSummary: viewSummary,
  deleteSummary: deleteSummary
};