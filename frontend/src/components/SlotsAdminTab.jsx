import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit, Trash2 } from 'lucide-react';
import { getSlotsApi, createSlotApi, updateSlotApi, deleteSlotApi } from '../api/parking';
import { useAuth } from '../context/AuthContext';

const SlotsAdminTab = () => {
  const { currentUser } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [formData, setFormData] = useState({ code: '', area: 'A', type: 'CAR' });

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const data = await getSlotsApi();
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

  const handleOpenModal = (slot = null) => {
    if (slot) {
      setEditingSlot(slot);
      setFormData({ code: slot.code, area: slot.area || 'A', type: slot.type });
    } else {
      setEditingSlot(null);
      setFormData({ code: '', area: 'A', type: 'CAR' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSlot) {
        await updateSlotApi(editingSlot.id, formData.code, formData.area, formData.type);
        alert('Cập nhật thành công!');
      } else {
        await createSlotApi(formData.code, formData.area, formData.type);
        alert('Thêm mới thành công!');
      }
      setShowModal(false);
      fetchSlots();
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa chỗ đỗ này? (Sẽ bị chặn nếu đang có xe)")) return;
    try {
      await deleteSlotApi(id);
      alert("Xóa thành công!");
      fetchSlots();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className="analytics-container" style={{ padding: '1rem' }}>
      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.5rem' }}>
            <Grid style={{ color: 'var(--primary)' }} /> Quản Lý Chỗ Đỗ
          </h2>
          <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '0.5rem 1rem' }}>
            <Plus size={18} /> Thêm Mới
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>ID</th>
                  <th style={{ padding: '1rem' }}>Mã Chỗ</th>
                  <th style={{ padding: '1rem' }}>Khu Vực</th>
                  <th style={{ padding: '1rem' }}>Loại Xe</th>
                  <th style={{ padding: '1rem' }}>Trạng Thái</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {slots.map(slot => (
                  <tr key={slot.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem' }}>{slot.id}</td>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{slot.code}</td>
                    <td style={{ padding: '1rem' }}>Khu {slot.area || 'A'}</td>
                    <td style={{ padding: '1rem' }}>{slot.type === 'CAR' ? 'Ô Tô' : 'Xe Máy'}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.8rem',
                        background: slot.status === 'AVAILABLE' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: slot.status === 'AVAILABLE' ? '#10b981' : '#ef4444'
                      }}>
                        {slot.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(slot)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', marginRight: '1rem' }}>
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(slot.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '12px', background: 'var(--bg-card)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{editingSlot ? 'Sửa Chỗ Đỗ' : 'Thêm Chỗ Đỗ Mới'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Mã Chỗ (VD: A01)</label>
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Khu Vực (VD: A)</label>
                <input required type="text" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Loại Xe</label>
                <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="CAR">Ô Tô</option>
                  <option value="MOTORBIKE">Xe Máy</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlotsAdminTab;
