let currentUser = null;
let verifyEmail = "";
let authPollInterval = null;

// Khởi chạy khi tải trang
window.addEventListener('DOMContentLoaded', () => {
  // Nếu chưa có currentUser, bắt đầu poll lấy hộp thư OTP
  if (!currentUser) {
    document.getElementById('auth-overlay').style.display = 'flex';
    startAuthPolling();
  }
});

function startAuthPolling() {
  if (authPollInterval) return;
  authPollInterval = setInterval(async () => {
    if (currentUser) {
      clearInterval(authPollInterval);
      authPollInterval = null;
      return;
    }
    try {
      const res = await fetch(`${API}/notifications/`);
      if (!res.ok) return;
      const notifs = await res.json();
      const inbox = document.getElementById("auth-mail-inbox");
      
      if (notifs.length === 0) return;
      
      // Reverse to get newest first
      const sortedNotifs = [...notifs].reverse();
      
      let html = "";
      sortedNotifs.forEach(n => {
        if (n.type === "Email") {
          const time = new Date(n.sentAt).toLocaleTimeString();
          html += `
            <div style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; text-align: left;">
              <div style="font-size: 0.75rem; color: #34d399; margin-bottom: 0.5rem; font-weight: bold; display: flex; justify-content: space-between;">
                <span>[EMAIL ĐẾN]</span>
                <span>${time}</span>
              </div>
              <div style="font-size: 0.85rem; color: white; white-space: pre-wrap; line-height: 1.4;">${n.message}</div>
            </div>
          `;
        }
      });
      
      if (html) {
        inbox.innerHTML = html;
      }
    } catch(e) {}
  }, 2000); // poll every 2 seconds
}

function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('#auth-tabs .tab-btn');
  tabs.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('verify-form').style.display = 'none';
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    document.getElementById('login-form').style.display = 'block';
  } else if (tab === 'register') {
    tabs[1].classList.add('active');
    document.getElementById('register-form').style.display = 'block';
  } else if (tab === 'verify') {
    document.getElementById('verify-form').style.display = 'block';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    addLog("gateway", "ROUTE /auth/login", "Đang định tuyến yêu cầu đăng nhập sang Auth Service...");
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      currentUser = data.user;
      currentUser.token = data.token;
      
      // Thành công -> Ẩn overlay
      document.getElementById('auth-overlay').style.display = 'none';
      
      showUserProfile();
      addLog("auth", "POST /login", "Đăng nhập thành công làm: " + data.user.name);
      
      // Load data
      loadBookings();
      if(typeof loadPaymentHistory === 'function') loadPaymentHistory();
      
    } else {
      if (res.status === 403) {
        // Chưa xác thực
        alert("Tài khoản chưa được xác minh email. Vui lòng kiểm tra email (hộp thư mô phỏng bên phải) để lấy mã OTP.");
        verifyEmail = email;
        switchAuthTab('verify');
      } else {
        alert(data.message);
      }
      addLog("auth", "POST /login", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("auth", "ERROR", "Không thể kết nối dịch vụ xác thực: " + err.message);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;
  const plateNumber = document.getElementById("reg-plate").value;

  try {
    addLog("gateway", "ROUTE /auth/register", "Đang định tuyến yêu cầu đăng ký sang Auth Service...");
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, plateNumber })
    });
    const data = await res.json();
    
    if (res.ok) {
      addLog("auth", "POST /register", "Tạo tài khoản chờ xác minh thành công.");
      alert("Đăng ký thành công! Hệ thống đã gửi mã OTP xác nhận vào email của bạn (Vui lòng kiểm tra Hộp thư mô phỏng).");
      
      verifyEmail = email;
      switchAuthTab('verify');
    } else {
      alert(data.message);
      addLog("auth", "POST /register", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("auth", "ERROR", "Không thể kết nối dịch vụ đăng ký: " + err.message);
  }
}

async function handleVerify(e) {
  e.preventDefault();
  const otp = document.getElementById("verify-otp").value;
  
  if (!verifyEmail) {
    alert("Không tìm thấy email cần xác nhận. Vui lòng đăng nhập lại.");
    switchAuthTab('login');
    return;
  }

  try {
    addLog("gateway", "ROUTE /auth/verify", `Gửi yêu cầu xác thực OTP cho ${verifyEmail}...`);
    const res = await fetch(`${API}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: verifyEmail, otp })
    });
    const data = await res.json();
    
    if (res.ok) {
      alert("Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.");
      document.getElementById("login-email").value = verifyEmail;
      switchAuthTab('login');
    } else {
      alert(data.message);
    }
  } catch(err) {
    alert("Lỗi kết nối: " + err.message);
  }
}

function showUserProfile() {
  document.getElementById("profile-name").textContent = currentUser.name;
  document.getElementById("profile-role").textContent = "Vai trò: " + currentUser.role;
  document.getElementById("profile-email").textContent = currentUser.email;
  document.getElementById("profile-plate").textContent = currentUser.plateNumber;
  
  // Update sidebar user card
  const usernameEl = document.getElementById("sidebar-username");
  const plateEl = document.getElementById("sidebar-plate");
  if (usernameEl) usernameEl.textContent = currentUser.name;
  if (plateEl) plateEl.textContent = currentUser.plateNumber;
}

function handleLogout() {
  if (confirm("Bạn có chắc chắn muốn đăng xuất không?")) {
    currentUser = null;
    verifyEmail = "";
    document.getElementById('login-password').value = "";
    document.getElementById('verify-otp').value = "";
    
    // Hiện lại overlay đăng nhập
    document.getElementById('auth-overlay').style.display = 'flex';
    switchAuthTab('login');
    
    // Khởi động lại polling email
    startAuthPolling();
    
    addLog("auth", "SYSTEM", "Người dùng đã đăng xuất.");
    
    // Reset data
    const bookingsList = document.getElementById("bookings-list");
    if (bookingsList) bookingsList.innerHTML = `<div class="empty-state"><i data-lucide="calendar"></i><p>Vui lòng đăng nhập để xem lịch sử đặt chỗ.</p></div>`;
    
    // Reset sidebar user card
    const usernameEl = document.getElementById("sidebar-username");
    const plateEl = document.getElementById("sidebar-plate");
    if (usernameEl) usernameEl.textContent = "Khách";
    if (plateEl) plateEl.textContent = "Chưa đăng nhập";
    
    lucide.createIcons();
  }
}
