// js/main.js
document.addEventListener("DOMContentLoaded", function() {
  // Khởi tạo các sự kiện đóng modal
  initModalCloseEvents();

  // Khởi tạo tất cả sự kiện (nút, input, select...)
  initEvents();

  // Render toàn bộ giao diện
  renderAll();
});