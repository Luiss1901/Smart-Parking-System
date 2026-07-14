import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import AuthOverlay from '../components/AuthOverlay';
import ParkingGrid from '../components/ParkingGrid';
import BookingPanel from '../components/BookingPanel';
import AnalyticsTab from '../components/AnalyticsTab';
import DiagnosticsTab from '../components/DiagnosticsTab';
import HardwareTab from '../components/HardwareTab';
import ProfileTab from '../components/ProfileTab';
import SlotsAdminTab from '../components/SlotsAdminTab';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Terminal, Cpu, User } from 'lucide-react';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const bookingPanelRef = useRef(null);
  const parkingGridRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    if (paymentStatus) {
      if (paymentStatus === 'success') {
        setToastMessage(`Thanh toán thành công!`);
        setToastType('success');
      } else {
        setToastMessage('Thanh toán thất bại hoặc bị hủy.');
        setToastType('error');
      }
      
      // Xóa URL query để tránh lặp lại khi reload
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Gọi refresh
      setTimeout(() => {
        handleBookingComplete();
      }, 500);
    }
  }, []);

  const handleBookingComplete = () => {
    if (bookingPanelRef.current) {
      bookingPanelRef.current.refresh();
    }
    if (parkingGridRef.current) {
      parkingGridRef.current.refresh();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview-grid">
            <ParkingGrid ref={parkingGridRef} onBookingComplete={handleBookingComplete} />
            <BookingPanel ref={bookingPanelRef} />
          </div>
        );
      case 'analytics':
        return <AnalyticsTab />;
      case 'diagnostics':
        return <DiagnosticsTab />;
      case 'hardware':
        return <HardwareTab />;
      case 'slots':
        return <SlotsAdminTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <div>Tab content not found</div>;
    }
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Tổng Quan Hệ Thống';
      case 'analytics': return 'Báo Cáo & Phân Tích';
      case 'diagnostics': return 'Nhật Ký Giao Tiếp';
      case 'hardware': return 'Giả Lập Thiết Bị Phần Cứng';
      case 'slots': return 'Quản Lý Bãi Đỗ';
      case 'profile': return 'Hồ Sơ Cá Nhân';
      default: return '';
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="main-content">
        <div className="content-header">
          <h2 className="content-header-title">{getPageTitle()}</h2>
          <div className="status-indicator">
            <div className="status-dot"></div>
            <span>Gateway Online (8080)</span>
          </div>
        </div>

        {renderTabContent()}
      </main>

      {!currentUser && <AuthOverlay />}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          type={toastType} 
          onClose={() => setToastMessage(null)} 
        />
      )}
    </div>
  );
};

export default Dashboard;
