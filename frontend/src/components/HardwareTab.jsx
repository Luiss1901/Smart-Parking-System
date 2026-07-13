import React, { useState, useEffect } from 'react';
import { Cpu, Camera, LogIn, LogOut, RefreshCw, Car } from 'lucide-react';
import { getSlotsApi } from '../api/parking';
import { simulateCameraApi, simulateBarrierApi } from '../api/device';

const HardwareTab = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [actionStatus, setActionStatus] = useState(null);

  const fetchSlots = async () => {
    try {
      const data = await getSlotsApi();
      setSlots(data);
    } catch (error) {
      console.error("Error fetching slots", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 5000); // Polling for real-time updates
    return () => clearInterval(interval);
  }, []);

  const handleSimulateAction = async (action) => {
    if (!selectedSlot) {
      setActionStatus({ type: 'error', message: 'Vui lòng chọn một ô đỗ xe trước!' });
      return;
    }

    const slotData = slots.find(s => s.id === selectedSlot);
    
    if (action === 'ENTER' && slotData.status !== 'AVAILABLE') {
      setActionStatus({ type: 'error', message: `Ô ${slotData.code} không còn trống!` });
      return;
    }
    
    if (action === 'EXIT' && slotData.status === 'AVAILABLE') {
      setActionStatus({ type: 'error', message: `Ô ${slotData.code} hiện không có xe!` });
      return;
    }

    try {
      const res = await simulateCameraApi(selectedSlot, action, "");
      setActionStatus({ type: 'success', message: `Đã mô phỏng: Xe ${res.plateNumber} ${action === 'ENTER' ? 'vào' : 'ra'} ô ${slotData.code}` });
      fetchSlots(); // Refresh list immediately
    } catch (error) {
      setActionStatus({ type: 'error', message: error.message || 'Lỗi cập nhật trạng thái' });
    }
  };

  if (loading && slots.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.6)' }}>
        <RefreshCw className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="hardware-container" style={{ padding: '1rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
      
      {/* Left panel - Emulator Controls */}
      <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          <Cpu size={24} style={{ color: '#3b82f6' }} /> Bảng Điều Khiển Giả Lập
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Chọn vị trí cảm biến (Ô đỗ):</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
            {slots.map(slot => (
              <button 
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                style={{ 
                  padding: '0.75rem', 
                  borderRadius: '6px', 
                  border: `1px solid ${selectedSlot === slot.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                  background: selectedSlot === slot.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {slot.code}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button 
            className="btn" 
            onClick={() => handleSimulateAction('ENTER')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#ef4444', color: 'white' }}
          >
            <Camera size={18} /> Quét Xe Vào
          </button>
          <button 
            className="btn" 
            onClick={() => handleSimulateAction('EXIT')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#10b981', color: 'white' }}
          >
            <LogOut size={18} /> Quét Xe Ra
          </button>
        </div>

        {actionStatus && (
          <div style={{ 
            padding: '1rem', 
            borderRadius: '8px', 
            background: actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${actionStatus.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: actionStatus.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.9rem'
          }}>
            {actionStatus.message}
          </div>
        )}
      </div>

      {/* Right panel - Live State */}
      <div className="glass-panel" style={{ flex: '1 1 300px', padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          <Car size={24} style={{ color: '#a855f7' }} /> Trạng Thái Cảm Biến Thực Tế
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {slots.map(slot => (
            <div key={slot.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px',
              borderLeft: `4px solid ${slot.status === 'AVAILABLE' ? '#10b981' : slot.status === 'OCCUPIED' ? '#ef4444' : '#f59e0b'}`
            }}>
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Vị trí {slot.code}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: slot.status === 'AVAILABLE' ? '#10b981' : slot.status === 'OCCUPIED' ? '#ef4444' : '#f59e0b',
                  boxShadow: `0 0 8px ${slot.status === 'AVAILABLE' ? '#10b981' : slot.status === 'OCCUPIED' ? '#ef4444' : '#f59e0b'}`
                }}></span>
                <span style={{ 
                  fontSize: '0.85rem', 
                  color: slot.status === 'AVAILABLE' ? '#10b981' : slot.status === 'OCCUPIED' ? '#ef4444' : '#f59e0b' 
                }}>
                  {slot.status === 'AVAILABLE' ? 'Đang trống' : slot.status === 'OCCUPIED' ? 'Có xe' : 'Đã đặt trước'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default HardwareTab;
