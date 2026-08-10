// js/main.js
document.addEventListener("DOMContentLoaded", function() {
  initModalCloseEvents();
  initEvents();
  renderAll();

  // Nếu cần lưu trạng thái đăng nhập (sessionStorage) thì thêm ở đây
  // Ví dụ: if (sessionStorage.getItem("teacher") === "true") { isTeacherMode = true; updateUIByRole(); }
});