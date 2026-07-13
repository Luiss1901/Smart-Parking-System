import React, { useState, useEffect } from 'react';
import { ParkingCircle, LogIn, UserPlus, CheckCircle, Mail, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginApi, registerApi, verifyApi, getMailApi } from '../api/auth';
import { showToast } from './Toast';

const AuthOverlay = () => {
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // login | register | verify
  const [verifyEmail, setVerifyEmail] = useState('');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlate, setRegPlate] = useState('');
  
  // Verify Form State
  const [otp, setOtp] = useState('');

  // Notifications (Simulated Mail)
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Poll for emails
    const interval = setInterval(async () => {
      try {
        const notifs = await getMailApi();
        setNotifications([...notifs].reverse());
      } catch (e) {
        // ignore errors for polling
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await loginApi(loginEmail, loginPassword);
      login({ ...data.user, token: data.token });
    } catch (err) {
      if (err.status === 403) {
        showToast("Tài khoản chưa được xác minh email. Vui lòng kiểm tra email (hộp thư mô phỏng bên phải) để lấy mã OTP.", "warning");
        setVerifyEmail(loginEmail);
        setActiveTab('verify');
      } else {
        showToast(err.message || "Đăng nhập thất bại.", "error");
      }
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await registerApi(regName, regEmail, regPassword, regPlate);
      showToast("Đăng ký thành công! Hệ thống đã gửi mã OTP xác nhận vào email của bạn (Vui lòng kiểm tra Hộp thư mô phỏng).", "success");
      setVerifyEmail(regEmail);
      setActiveTab('verify');
    } catch (err) {
      showToast(err.message || "Đăng ký thất bại.", "error");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyEmail) {
      showToast("Không tìm thấy email cần xác nhận. Vui lòng đăng nhập lại.", "error");
      setActiveTab('login');
      return;
    }
    try {
      await verifyApi(verifyEmail, otp);
      showToast("Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.", "success");
      setLoginEmail(verifyEmail);
      setActiveTab('login');
    } catch (err) {
      showToast("Lỗi kết nối: " + err.message, "error");
    }
  };

  return (
    <div className="auth-overlay" style={{ display: 'flex' }}>
      <div className="auth-overlay-content">
        {/* Left: Auth Form */}
        <div className="auth-left">
          <div className="auth-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <ParkingCircle style={{ color: 'var(--primary)', width: '36px', height: '36px' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Smart Parking</h2>
          </div>
          
          <div className="tab-container" style={{ marginBottom: '2rem' }}>
            <button className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>Đăng Nhập</button>
            <button className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}>Đăng Ký</button>
          </div>

          {activeTab === 'login' && (
            <form onSubmit={handleLogin}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.35rem' }}>Đăng Nhập Hệ Thống</h3>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" placeholder="user@example.com" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Mật khẩu</label>
                <input type="password" className="form-control" placeholder="••••••••" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                <LogIn size={20} /> Đăng Nhập
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: 600, fontSize: '1.35rem', flexShrink: 0 }}>Tạo Tài Khoản Mới</h3>
              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', paddingBottom: '0.5rem' }}>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" className="form-control" placeholder="Nguyễn Văn A" value={regName} onChange={e => setRegName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-control" placeholder="user@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input type="password" className="form-control" placeholder="••••••••" value={regPassword} onChange={e => setRegPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Biển số xe</label>
                  <input type="text" className="form-control" placeholder="30A-999.99" value={regPlate} onChange={e => setRegPlate(e.target.value)} required />
                </div>
              </div>
              <button type="submit" className="btn" style={{ marginTop: '1rem', flexShrink: 0 }}>
                <UserPlus size={20} /> Đăng Ký Tức Thì
              </button>
            </form>
          )}

          {activeTab === 'verify' && (
            <form onSubmit={handleVerify}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600, fontSize: '1.35rem' }}>Xác Minh Email</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.5 }}>
                Hệ thống đã gửi Mã OTP. Vui lòng kiểm tra <b>Hộp thư cá nhân (bên phải)</b> và nhập mã gồm 6 số để kích hoạt tài khoản.
              </p>
              <div className="form-group">
                <label>Mã Xác Nhận OTP</label>
                <input type="text" className="form-control" placeholder="123456" maxLength="6" value={otp} onChange={e => setOtp(e.target.value)} required style={{ fontSize: '1.75rem', letterSpacing: '12px', textAlign: 'center', fontWeight: 'bold', padding: '1rem' }} />
              </div>
              <button type="submit" className="btn" style={{ marginTop: '1rem' }}>
                <CheckCircle size={20} /> Kích Hoạt Tài Khoản
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setActiveTab('login')} style={{ marginTop: '1rem' }}>
                Quay Lại Đăng Nhập
              </button>
            </form>
          )}
        </div>
        
        {/* Right: Simulated Mailbox */}
        <div className="auth-right">
          <div className="mail-sim-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={20} /> <span style={{ fontWeight: 600 }}>Hộp Thư Mô Phỏng</span>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.05)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: 'var(--text-muted)' }}>Chỉ phục vụ Demo</span>
          </div>
          <div className="mail-sim-body">
            {notifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', paddingTop: '4rem' }}>
                <Inbox size={48} style={{ marginBottom: '1rem', strokeWidth: 1.5, display: 'inline-block' }} />
                <p>Hộp thư trống.<br/>Mã OTP đăng ký sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              notifications.map((n, i) => n.type === 'Email' ? (
                <div key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '1rem', marginBottom: '0.75rem', textAlign: 'left' }}>
                  <div style={{ fontSize: '0.75rem', color: '#34d399', marginBottom: '0.5rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>[EMAIL ĐẾN]</span>
                    <span>{new Date(n.sentAt).toLocaleTimeString()}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{n.message}</div>
                </div>
              ) : null)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthOverlay;
