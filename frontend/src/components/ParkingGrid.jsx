import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Grid, RotateCw, Filter } from 'lucide-react';
import { getSlotsApi } from '../api/parking';
import SlotCard from './SlotCard';
import BookingModal from './BookingModal';

const ParkingGrid = forwardRef(({ onBookingComplete }, ref) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Filters
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await getSlotsApi();
      // Sort to ensure codes like A01, A02, A10 are ordered properly
      data.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
      setSlots(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchSlots
  }));

  const handleBookingComplete = () => {
    setSelectedSlot(null);
    fetchSlots();
    if (onBookingComplete) onBookingComplete();
  };

  const filteredSlots = slots.filter(slot => {
    if (zoneFilter !== 'ALL' && !slot.code.startsWith(zoneFilter)) return false;
    if (typeFilter !== 'ALL' && slot.type !== typeFilter) return false;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'AVAILABLE' && slot.status !== 'AVAILABLE') return false;
      if (statusFilter === 'UNAVAILABLE' && slot.status === 'AVAILABLE') return false;
    }
    return true;
  });

  return (
    <div className="glass-card">
      <div className="card-title">
        <Grid size={24} /> <span>Sơ Đồ Bãi Xe Trực Quan</span>
        <button onClick={fetchSlots} className="btn btn-secondary" style={{ width: 'auto', padding: '0.3rem 0.8rem', fontSize: '0.8rem', marginLeft: 'auto', borderRadius: '8px' }}>
          <RotateCw size={14} style={{ marginRight: '0.25rem' }} /> Tải lại
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-0.75rem', marginBottom: '1.5rem' }}>
        Chọn ô đỗ màu xanh để đặt chỗ nhanh.
      </p>

      {/* Filters Section */}
      <div className="filters-container">
        <div className="zone-tabs">
          {['ALL', 'A', 'B', 'C', 'D'].map(zone => (
            <button
              key={zone}
              className={`zone-tab-btn ${zoneFilter === zone ? 'active' : ''}`}
              onClick={() => setZoneFilter(zone)}
            >
              {zone === 'ALL' ? 'Tất cả' : `Khu ${zone}`}
            </button>
          ))}
        </div>
        
        <div className="dropdown-filters">
          <div className="filter-group">
            <Filter size={14} />
            <select 
              value={typeFilter} 
              onChange={e => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Loại xe: Tất cả</option>
              <option value="CAR">Ô tô</option>
              <option value="MOTORBIKE">Xe máy</option>
            </select>
          </div>
          <div className="filter-group">
            <Filter size={14} />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Trạng thái: Tất cả</option>
              <option value="AVAILABLE">Trống</option>
              <option value="UNAVAILABLE">Có xe/Đã đặt</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="parking-grid-container">
        <div className="parking-grid">
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>
              Đang tải bãi đỗ...
            </div>
          ) : filteredSlots.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', gridColumn: '1 / -1' }}>
              Không có ô đỗ nào phù hợp với bộ lọc.
            </div>
          ) : (
            filteredSlots.map(slot => (
              <SlotCard key={slot.id} slot={slot} onClick={setSelectedSlot} />
            ))
          )}
        </div>
      </div>

      {selectedSlot && (
        <BookingModal 
          slot={selectedSlot} 
          onClose={() => setSelectedSlot(null)}
          onSuccess={handleBookingComplete}
        />
      )}
    </div>
  );
});

export default ParkingGrid;
