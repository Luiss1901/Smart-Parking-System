import React, { useState } from 'react';
import { Calendar, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createBookingApi } from '../api/booking';
import { showToast } from './Toast';

const BookingModal = ({ slot, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [hours, setHours] = useState(2);
  const [vehicleType, setVehicleType] = useState('CAR');

  const getPrice = () => {
    return vehicleType === 'CAR' ? 20000 : 5000;
  };

  const estimatedCost = getPrice() * hours;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('Vui lòng đăng nhập!', 'error');
      return;
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);
    // Format to YYYY-MM-DD HH:mm:ss as expected by API
    const formatTime = (d) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    try {
      await createBookingApi(currentUser.id, slot.id, formatTime(startTime), formatTime(endTime));
      showToast("Đặt chỗ thành công!", "success");
      onSuccess();
    } catch (err) {
      showToast(err.message || "Lỗi kết nối Booking Service", "error");
    }
  };

  return (
    <div className="modal-backdrop show">
      <div className="modal-content">
        <div className="modal-header">
          <h3 style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar style={{ color: 'var(--primary)' }} /> Đặt Chỗ Cho Ô <span style={{ color: 'var(--primary)' }}>{slot.code}</span>
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Loại phương tiện</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input type="radio" name="vehicleType" value="CAR" checked={vehicleType === 'CAR'} onChange={() => setVehicleType('CAR')} /> Xe Ô tô (CAR)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                <input type="radio" name="vehicleType" value="BIKE" checked={vehicleType === 'BIKE'} onChange={() => setVehicleType('BIKE')} /> Xe Máy (BIKE)
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Thời gian đỗ (Giờ)</label>
            <input type="number" className="form-control" min="1" max="24" value={hours} onChange={e => setHours(parseInt(e.target.value))} required />
          </div>

          <div className="price-preview-box">
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đơn giá & Ước tính chi phí</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {vehicleType === 'CAR' ? 'Ô tô: 20,000đ/giờ' : 'Xe máy: 5,000đ/giờ'}
              </p>
            </div>
            <div className="price-value">{estimatedCost.toLocaleString()}đ</div>
          </div>

          <button type="submit" className="btn">
            <CheckCircle size={20} /> Xác Nhận Đặt Chỗ
          </button>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
