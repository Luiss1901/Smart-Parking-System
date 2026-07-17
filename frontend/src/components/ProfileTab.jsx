import React, { useState, useEffect } from 'react';
import { User, Save, RefreshCw, Car } from 'lucide-react';
import { getProfileApi, updateProfileApi, changePasswordApi } from '../api/user';
import { useAuth } from '../context/AuthContext';

const ProfileTab = () => {
  const { currentUser: user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', plateNumber: '' });
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getProfileApi(user.id);
        setProfile(data);
        setFormData({ name: data.name || '', plateNumber: data.plateNumber || '' });
      } catch (err) {
        setStatus({ type: 'error', message: 'Lỗi tải hồ sơ' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await updateProfileApi(user.id, formData);
      setProfile(res.user);
      setStatus({ type: 'success', message: 'Cập nhật thành công!' });
      
      const updatedUser = { ...user, ...res.user };
      sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));
      
    } catch (error) {
      setStatus({ type: 'error', message: error.message || 'Cập nhật thất bại' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwStatus(null);
    try {
      await changePasswordApi(user.id, passwordData.oldPassword, passwordData.newPassword);
      setPwStatus({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setPasswordData({ oldPassword: '', newPassword: '' });
    } catch (error) {
      setPwStatus({ type: 'error', message: error.message || 'Đổi mật khẩu thất bại' });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="profile-container" style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
            <User size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Hồ Sơ Cá Nhân</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{profile?.email}</p>
          </div>
        </div>

        {status && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem',
            borderRadius: '8px', 
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: status.type === 'success' ? '#10b981' : '#ef4444',
          }}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Họ và tên</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <User size={18} />
              </div>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 3rem', 
                  borderRadius: '8px', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none'
                }} 
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Biển số xe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Car size={18} />
              </div>
              <input 
                type="text" 
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem 0.75rem 3rem', 
                  borderRadius: '8px', 
                  background: 'var(--bg-input)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  textTransform: 'uppercase'
                }} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              background: 'var(--primary)', 
              color: 'var(--text-primary)',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem',
              opacity: saving ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </form>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '2rem 0' }} />

        <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Đổi Mật Khẩu</h3>
        
        {pwStatus && (
          <div style={{ 
            padding: '1rem', 
            marginBottom: '1.5rem',
            borderRadius: '8px', 
            background: pwStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${pwStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: pwStatus.type === 'success' ? '#10b981' : '#ef4444',
          }}>
            {pwStatus.message}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Mật khẩu cũ</label>
            <input 
              type="password" 
              name="oldPassword"
              value={passwordData.oldPassword}
              onChange={handlePasswordChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: 'var(--bg-input)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none'
              }} 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Mật khẩu mới</label>
            <input 
              type="password" 
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              style={{ 
                width: '100%', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                background: 'var(--bg-input)', 
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                outline: 'none'
              }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={pwSaving}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem', 
              background: 'var(--danger)', 
              color: 'var(--text-primary)',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: pwSaving ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              marginTop: '1rem',
              opacity: pwSaving ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {pwSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            Đổi mật khẩu
          </button>
        </form>

      </div>
    </div>
  );
};

export default ProfileTab;
