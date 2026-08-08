// js/main.js
// Khởi tạo ứng dụng sau khi DOM sẵn sàng

document.addEventListener("DOMContentLoaded", function() {
  // Khởi tạo các sự kiện đóng modal
  initModalCloseEvents();

  // Khởi tạo tất cả sự kiện (button, input, select...)
  initEvents();

  // Render toàn bộ giao diện
  renderAll();
});