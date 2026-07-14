import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Activity, Info, List, Clock, CheckCircle, XCircle } from 'lucide-react';
import { getRevenueApi, getUsageApi } from '../api/reports';
import { getPaymentsHistoryApi, refundPaymentApi } from '../api/payment';
import { useAuth } from '../context/AuthContext';

const AnalyticsTab = () => {
  const { currentUser } = useAuth();
  const [revenueData, setRevenueData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setErrorMsg(null);
        
        // Cố gắng gọi api tuần tự hoặc song song nhưng bắt lỗi rõ ràng
        const rev = await getRevenueApi();
        setRevenueData(rev);
        
        const usg = await getUsageApi();
        setUsageData(usg);

        if (currentUser?.id) {
          const hist = await getPaymentsHistoryApi(currentUser.id);
          setHistoryData(hist);
        }
      } catch (err) {
        console.error("Error fetching analytics data", err);
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [currentUser]);

  if (loading && !revenueData && !errorMsg) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'rgba(255,255,255,0.6)' }}>
        <Activity className="animate-spin" style={{ animation: 'spin 2s linear infinite' }} size={32} />
        <span style={{ marginLeft: '1rem' }}>Đang tải báo cáo...</span>
      </div>
    );
  }

  return (
    <div className="analytics-container" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {errorMsg && (
        <div style={{ 
          padding: '1rem', 
          borderRadius: '8px', 
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          marginBottom: '1rem'
        }}>
          <strong>Lỗi lấy dữ liệu:</strong> {errorMsg}
        </div>
      )}

      {/* Thẻ Kpi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* Doanh Thu */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', color: '#10b981' }}>
            <DollarSign size={28} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Doanh Thu Hôm Nay</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{revenueData?.totalRevenue?.toLocaleString('vi-VN')} ₫</h3>
          </div>
        </div>

        {/* Lượt Giao Dịch */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '50%', color: '#3b82f6' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Lượt Giao Dịch</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{revenueData?.totalPayments}</h3>
          </div>
        </div>

        {/* Hiệu Suất */}
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '1rem', borderRadius: '50%', color: '#a855f7' }}>
            <Activity size={28} />
          </div>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Hiệu Suất Lấp Đầy</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{usageData?.usageRate}</h3>
          </div>
        </div>

      </div>

      {/* Chi tiết bãi đỗ */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
          <Info size={20} style={{ color: 'var(--primary)' }} /> Chi Tiết Chỗ Đỗ Xe
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Tổng Số Chỗ</p>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{usageData?.totalSlots}</span>
          </div>
          
          <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <p style={{ color: 'rgba(239, 68, 68, 0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Đang Có Xe</p>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{usageData?.occupiedSlots}</span>
          </div>
          
          <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <p style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Còn Trống</p>
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{usageData?.availableSlots}</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>Sức Chứa</span>
            <span>{usageData?.occupiedSlots} / {usageData?.totalSlots}</span>
          </div>
          <div style={{ height: '8px', width: '100%', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              height: '100%', 
              background: `linear-gradient(90deg, #10b981 0%, #ef4444 100%)`, 
              width: usageData?.usageRate || '0%',
              transition: 'width 1s ease-in-out'
            }}></div>
          </div>
        </div>

      </div>

      {/* Lịch Sử Thanh Toán */}
      {currentUser && (
        <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            <List size={20} style={{ color: 'var(--primary)' }} /> Lịch Sử Thanh Toán
          </h4>

          {historyData.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '2rem' }}>
              Chưa có giao dịch nào
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                    <th style={{ padding: '1rem 0.5rem' }}>Mã Booking</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Mã GD</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Số tiền</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Thời gian</th>
                    <th style={{ padding: '1rem 0.5rem' }}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map(hist => (
                    <tr key={hist.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem 0.5rem' }}>#{hist.bookingId}</td>
                      <td style={{ padding: '1rem 0.5rem' }}>{hist.txnRef}</td>
                      <td style={{ padding: '1rem 0.5rem', fontWeight: 'bold' }}>{hist.amount.toLocaleString('vi-VN')} đ</td>
                      <td style={{ padding: '1rem 0.5rem', color: 'rgba(255,255,255,0.7)' }}>
                        {hist.paidAt ? new Date(hist.paidAt).toLocaleString('vi-VN') : '-'}
                      </td>
                      <td style={{ padding: '1rem 0.5rem' }}>
                        {hist.status === 'PAID' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.8rem' }}>
                              <CheckCircle size={14} /> PAID
                            </span>
                            <button 
                              onClick={async () => {
                                if (!window.confirm("Bạn có chắc chắn muốn hoàn tiền? Đặt chỗ sẽ bị hủy.")) return;
                                try {
                                  await refundPaymentApi(hist.id);
                                  alert("Hoàn tiền thành công!");
                                  window.location.reload();
                                } catch (err) {
                                  alert("Lỗi: " + err.message);
                                }
                              }} 
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Hoàn Tiền
                            </button>
                          </div>
                        ) : hist.status === 'FAILED' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.8rem' }}>
                            <XCircle size={14} /> FAILED
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.8rem' }}>
                            <Clock size={14} /> PENDING
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AnalyticsTab;
