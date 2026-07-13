import React from 'react';

const BookingItem = ({ booking, isPaid, onCancel, onPay }) => {
  let statusBadge = <span className="badge-status badge-reserved">Chưa Thanh Toán</span>;
  let payButton = null;
  let cancelButton = null;

  if (booking.status === "CANCELLED") {
    statusBadge = <span className="badge-status badge-occupied" style={{ background: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-muted)' }}>Đã Hủy</span>;
  } else if (isPaid) {
    statusBadge = <span className="badge-status badge-available">Đã Thanh Toán</span>;
  } else {
    payButton = (
      <button onClick={() => onPay(booking.id)} className="btn" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', background: 'var(--success)', boxShadow: '0 4px 10px var(--success-glow)' }}>
        Thanh Toán
      </button>
    );
    cancelButton = (
      <button onClick={() => onCancel(booking.id)} className="btn btn-secondary" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        Hủy
      </button>
    );
  }

  // Formatting times (assuming booking.startTime is something like "2026-07-10 14:00:00")
  const startFormat = booking.startTime.slice(11, 16);
  const endFormat = booking.endTime.slice(11, 16);

  return (
    <div className="booking-list-item">
      <div className="booking-info">
        <h4>Đặt chỗ ô: Slot ID {booking.slotId} (ID: {booking.id})</h4>
        <p>Bắt đầu: {startFormat} | Kết thúc: {endFormat}</p>
        <p style={{ marginTop: '0.25rem' }}>Trạng thái: {statusBadge}</p>
      </div>
      <div className="booking-actions">
        {payButton}
        {cancelButton}
      </div>
    </div>
  );
};

export default BookingItem;
