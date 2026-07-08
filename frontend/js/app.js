// On Load / App initialization
window.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  lucide.createIcons();
  
  // Log startup message
  addLog("gateway", "SYSTEM", "Khởi động giao diện Dashboard thành công. Kết nối gateway: " + API);
  
  // Auto register/login simulated default user
  autoInitUser();
  
  // Load Initial Data
  loadSlots();
  loadBookings();
  loadReports();
});
