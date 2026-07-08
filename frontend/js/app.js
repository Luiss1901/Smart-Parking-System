// Tab switching logic
function switchTab(tabId) {
  // Update sidebar menu items active class
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeMenuBtn = document.getElementById(`menu-${tabId}`);
  if (activeMenuBtn) {
    activeMenuBtn.classList.add('active');
  }

  // Update main title
  const titleEl = document.getElementById('page-title');
  if (titleEl) {
    if (tabId === 'overview') titleEl.textContent = 'Tổng Quan Hệ Thống';
    else if (tabId === 'analytics') titleEl.textContent = 'Báo Cáo & Phân Tích';
    else if (tabId === 'diagnostics') titleEl.textContent = 'Nhật Ký Giao Tiếp';
    else if (tabId === 'profile') titleEl.textContent = 'Hồ Sơ Cá Nhân';
  }

  // Show/Hide tab content panels
  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.classList.remove('active');
  });
  const activePanel = document.getElementById(`tab-${tabId}`);
  if (activePanel) {
    activePanel.classList.add('active');
  }

  // Trigger content refreshes depending on active tab
  if (tabId === 'overview') {
    loadSlots();
    loadBookings();
  } else if (tabId === 'analytics') {
    loadReports();
  }
}

// Log filtering logic
function filterLogs(service) {
  // Update filter badge active states
  document.querySelectorAll('.diagnostics-filter-bar .filter-badge').forEach(badge => {
    badge.classList.remove('active');
  });
  
  const activeBadge = document.getElementById(`log-filter-${service}`);
  if (activeBadge) {
    activeBadge.classList.add('active');
  }

  // Show/hide lines
  document.querySelectorAll('.terminal-body .log-line').forEach(line => {
    if (service === 'all' || line.getAttribute('data-service') === service) {
      line.style.display = 'flex';
    } else {
      line.style.display = 'none';
    }
  });
}

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
