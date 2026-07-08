let currentUser = null;

// Auto-initialize a default user in in-memory auth-service
async function autoInitUser() {
  try {
    addLog("auth", "POST /register", "Đang tự động khởi tạo tài khoản thành viên nhóm...");
    const resReg = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Lâm Quang Lợi (Thành viên 5)",
        email: "member1@example.com",
        password: "password123",
        plateNumber: "30A-888.88"
      })
    });
    
    const dataReg = await resReg.json();
    if (resReg.ok) {
      addLog("auth", "POST /register", "Khởi tạo thành công: member1@example.com");
    } else {
      addLog("auth", "POST /register", "Tài khoản đã tồn tại: " + dataReg.message);
    }

    // Auto login
    const resLogin = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "member1@example.com",
        password: "password123"
      })
    });
    const dataLogin = await resLogin.json();
    if (resLogin.ok) {
      currentUser = dataLogin.user;
      currentUser.token = dataLogin.token;
      showUserProfile();
      addLog("auth", "POST /login", "Đăng nhập thành công! Token: " + dataLogin.token);
    }
  } catch (err) {
    addLog("auth", "ERROR", "Không thể tự động kết nối Auth Service. Vui lòng kiểm tra Docker Compose.");
  }
}

// Auth actions
function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('#auth-tabs .tab-btn');
  tabs.forEach(btn => btn.classList.remove('active'));
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
  } else {
    tabs[1].classList.add('active');
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
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
      showUserProfile();
      addLog("auth", "POST /login", "Đăng nhập thành công làm: " + data.user.name);
      loadBookings();
    } else {
      alert(data.message);
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
      addLog("auth", "POST /register", "Tạo tài khoản thành công! Hãy đăng nhập.");
      alert("Đăng ký thành công! Vui lòng chuyển sang tab Đăng Nhập.");
      switchAuthTab('login');
      document.getElementById("login-email").value = email;
      document.getElementById("login-password").value = password;
    } else {
      alert(data.message);
      addLog("auth", "POST /register", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("auth", "ERROR", "Không thể kết nối dịch vụ đăng ký: " + err.message);
  }
}

function showUserProfile() {
  document.getElementById("login-form").style.display = 'none';
  document.getElementById("register-form").style.display = 'none';
  document.getElementById("auth-tabs").style.display = 'none';
  
  document.getElementById("profile-name").textContent = currentUser.name;
  document.getElementById("profile-role").textContent = "Vai trò: " + currentUser.role;
  document.getElementById("profile-email").textContent = currentUser.email;
  document.getElementById("profile-plate").textContent = currentUser.plateNumber;
  
  document.getElementById("profile-container").style.display = 'block';

  // Update sidebar user card
  const usernameEl = document.getElementById("sidebar-username");
  const plateEl = document.getElementById("sidebar-plate");
  if (usernameEl) usernameEl.textContent = currentUser.name;
  if (plateEl) plateEl.textContent = currentUser.plateNumber;
}

function handleLogout() {
  currentUser = null;
  document.getElementById("profile-container").style.display = 'none';
  document.getElementById("auth-tabs").style.display = 'flex';
  switchAuthTab('login');
  addLog("auth", "SYSTEM", "Người dùng đã đăng xuất.");
  loadBookings();

  // Reset sidebar user card
  const usernameEl = document.getElementById("sidebar-username");
  const plateEl = document.getElementById("sidebar-plate");
  if (usernameEl) usernameEl.textContent = "Khách";
  if (plateEl) plateEl.textContent = "Chưa đăng nhập";
}
