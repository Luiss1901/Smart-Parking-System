import React, { useState, useEffect, useRef } from 'react';
import { 
  ParkingCircle, 
  LayoutDashboard, 
  TrendingUp, 
  Terminal, 
  Cpu, 
  User,
  Grid
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ activeTab, onTabChange }) => {
  const { currentUser, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Tổng Quan' },
    { id: 'analytics', icon: TrendingUp, label: 'Báo Cáo & Phân Tích' },
    { id: 'diagnostics', icon: Terminal, label: 'Nhật Ký Giao Tiếp' },
    { id: 'hardware', icon: Cpu, label: 'Giả Lập Thiết Bị' },
    { id: 'profile', icon: User, label: 'Hồ Sơ Cá Nhân' },
  ];

  if (currentUser && currentUser.role === 'ADMIN') {
    menuItems.splice(4, 0, { id: 'slots', icon: Grid, label: 'Quản Lý Bãi Đỗ' });
  }

  return (
    <aside className="sidebar">
      <div 
        className="sidebar-brand" 
        onClick={() => onTabChange('overview')}
        style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
        onMouseOver={e => e.currentTarget.style.opacity = 0.8}
        onMouseOut={e => e.currentTarget.style.opacity = 1}
      >
        <div className="brand-logo">
          <ParkingCircle />
        </div>
        <span>Smart Parking</span>
      </div>
      
      <ul className="sidebar-menu">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <button 
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div 
        className="sidebar-user" 
        id="sidebar-user-block"
        onClick={() => currentUser && setShowDropdown(!showDropdown)}
        style={{ cursor: currentUser ? 'pointer' : 'default', position: 'relative' }}
        ref={dropdownRef}
      >
        <div className="sidebar-user-avatar">
          <User size={24} />
        </div>
        <div className="sidebar-user-info">
          <span className="sidebar-username">
            {currentUser ? currentUser.name : 'Khách'}
          </span>
          <span className="sidebar-plate">
            {currentUser ? currentUser.plateNumber : 'Chưa đăng nhập'}
          </span>
        </div>

        {showDropdown && currentUser && (
          <div className="user-dropdown">
            <button onClick={(e) => { e.stopPropagation(); onTabChange('profile'); setShowDropdown(false); }}>Hồ Sơ Cá Nhân</button>
            <button onClick={(e) => { e.stopPropagation(); logout(); setShowDropdown(false); }} className="text-danger">Đăng Xuất</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
