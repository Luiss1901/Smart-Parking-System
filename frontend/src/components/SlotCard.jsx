import React from 'react';
import { Car } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SlotCard = ({ slot, onClick }) => {
  const { currentUser } = useAuth();
  const getBadgeClass = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'badge-available';
      case 'OCCUPIED': return 'badge-occupied';
      case 'RESERVED': return 'badge-reserved';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'TRỐNG';
      case 'OCCUPIED': return 'ĐANG ĐỖ';
      case 'RESERVED': return 'ĐÃ ĐẶT';
      default: return status;
    }
  };

  return (
    <div className={`parking-slot-card ${slot.status.toLowerCase()}`}>
      <div className="slot-header">
        <span className="slot-code">{slot.code}</span>
        <span className={`slot-badge ${getBadgeClass(slot.status)}`}>
          {getStatusLabel(slot.status)}
        </span>
      </div>
      <div className="slot-body">
        <span style={{ fontSize: '0.8rem' }}>Loại xe: {slot.type === 'CAR' ? 'Ô tô' : 'Xe máy'}</span>
        <div className="slot-icon">
          <Car size={32} />
        </div>
      </div>
      {slot.status === 'AVAILABLE' && currentUser && (
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
          <button 
            className="btn" 
            style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', width: 'auto' }}
            onClick={(e) => {
              e.stopPropagation();
              onClick(slot);
            }}
          >
            Đặt chỗ
          </button>
        </div>
      )}
    </div>
  );
};

export default SlotCard;
