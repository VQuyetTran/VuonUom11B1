// ============================================================
// FILE: main.js
// Khởi tạo dữ liệu, render lần đầu, tạo footer và gán sự kiện xuất/nhập/đặt lại
// ============================================================

// Khởi tạo dữ liệu
ensureData();

// Render toàn bộ giao diện
renderAll();

// Tạo footer chứa nút xuất/nhập/đặt lại (nếu chưa có)
if (!document.getElementById('exportDataBtn')) {
    const footer = document.createElement('div');
    footer.style.cssText =
        'margin-top:30px;padding:12px;background:white;border-radius:24px;border:1px solid #dce8d6;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;';
    footer.innerHTML = `
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button id="exportDataBtn" class="secondary">💾 Xuất JSON</button>
            <button id="importDataBtn" class="secondary">📂 Nhập JSON</button>
            <button id="resetDataBtn" class="danger">🔄 Đặt lại dữ liệu</button>
        </div>
        <div style="font-size:0.8rem;opacity:0.6;">Lưu tự động trong trình duyệt</div>
    `;
    document.body.appendChild(footer);

    // Gán sự kiện cho các nút
    document.getElementById('exportDataBtn').addEventListener('click', function() {
        const data = JSON.stringify({ version: VERSION, data: appData }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'VuonUom11B1_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('importDataBtn').addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (data.version === VERSION && data.data) {
                        if (confirm('Dữ liệu hiện tại sẽ bị ghi đè. Tiếp tục?')) {
                            appData = data.data;
                            saveData();
                            renderAll();
                            alert('Đã khôi phục dữ liệu.');
                        }
                    } else {
                        alert('File không hợp lệ hoặc phiên bản không khớp.');
                    }
                } catch (err) {
                    alert('Lỗi đọc file: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    document.getElementById('resetDataBtn').addEventListener('click', function() {
        if (confirm('⚠ Bạn có chắc muốn đặt lại toàn bộ dữ liệu? Hành động này không thể hoàn tác.')) {
            if (confirm('Xác nhận lần cuối: Đặt lại dữ liệu?')) {
                localStorage.removeItem(STORAGE_KEY);
                initDefaultData();
                loadData();
                renderAll();
                alert('Đã đặt lại dữ liệu về mặc định.');
            }
        }
    });
}

console.log('🌱 VƯỜN ƯƠM HẠNH PHÚC 11B1 đã sẵn sàng!');