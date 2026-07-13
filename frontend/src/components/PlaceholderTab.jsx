import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User } from 'lucide-react';

const PlaceholderTab = ({ title, icon: Icon, message, showProfile }) => {
  const { currentUser, logout } = useAuth();

  return (
    <div className="tab-content active">
      <div className="glass-card" style={{ maxWidth: showProfile ? '600px' : 'auto', margin: showProfile ? '0 auto' : '0' }}>
        <div className="card-title">
          {Icon && <Icon />} <span>{title}</span>
        </div>
        
        {showProfile && currentUser ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.15)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <User size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Xin chào!</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 500 }}>Vai trò: {currentUser.role || 'USER'}</p>
              </div>
            </div>
            <div className="user-info-row">
              <span>Email</span>
              <span>{currentUser.email}</span>
            </div>
            <div className="user-info-row">
              <span>Biển số xe</span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.plateNumber}</span>
            </div>
            <div className="user-info-row">
              <span>Trạng thái tài khoản</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Đã xác thực</span>
            </div>
            
            <button onClick={logout} className="btn btn-secondary" style={{ marginTop: '1.5rem', padding: '0.8rem' }}>
              <LogOut size={20} /> Đăng Xuất & Chuyển Đổi Tài Khoản
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <p>{message || "Nội dung đang được phát triển."}</p>
            {showProfile && !currentUser && (
              <p style={{ marginTop: '1rem' }}>Vui lòng đăng nhập để xem thông tin.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceholderTab;
