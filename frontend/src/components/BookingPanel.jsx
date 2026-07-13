import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBookingsByUserApi, cancelBookingApi } from '../api/booking';
import { getPaymentsApi, createPaymentUrlApi } from '../api/payment';
import { showToast } from './Toast';
import BookingItem from './BookingItem';

const BookingPanel = forwardRef((props, ref) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookingsAndPayments = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [userBookings, allPayments] = await Promise.all([
        getBookingsByUserApi(currentUser.id),
        getPaymentsApi().catch(() => []) // if payment service fails, return empty
      ]);

      setBookings(userBookings);
      setPayments(allPayments);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refresh: fetchBookingsAndPayments
  }));

  useEffect(() => {
    fetchBookingsAndPayments();
  }, [currentUser]);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy đặt chỗ này?")) return;
    try {
      await cancelBookingApi(bookingId);
      showToast("Đã hủy đặt chỗ thành công!", "success");
      fetchBookingsAndPayments();
    } catch (err) {
      // apiFetch already shows error toast
    }
  };

  const handlePay = async (booking) => {
    try {
      // Tính toán số tiền
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      const hours = Math.ceil((end - start) / (1000 * 60 * 60));
      // Tạm fix cứng giá theo loại xe trong logic của BookingModal: CAR 20000, BIKE 5000. 
      // Do Booking backend không lưu loại xe, nên mặc định là CAR hoặc có thể check loại slot
      // Ở đây ta tính 20000/h làm demo hoặc lý tưởng là dùng /calculate api.
      // Chúng ta sẽ giả định giá trị trung bình hoặc gọi API.
      // Nhưng để nhanh và an toàn, ta tạm tính 20000 * hours
      const amount = hours * 20000; 

      const data = await createPaymentUrlApi(booking.id, currentUser.id, amount);
      if (data && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      // apiFetch already shows error toast
    }
  };

  return (
    <div className="glass-card">
      <div className="card-title">
        <Receipt size={24} /> <span>Đặt Chỗ & Thanh Toán Của Bạn</span>
      </div>
      <div id="bookings-container">
        {!currentUser ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
            Chưa đăng nhập.
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
            Đang tải dữ liệu...
          </div>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem 0' }}>
            Bạn chưa có lượt đặt chỗ nào hoạt động.
          </div>
        ) : (
          bookings.map(booking => {
            const isPaid = payments.some(p => p.bookingId === booking.id);
            return (
              <BookingItem 
                key={booking.id} 
                booking={booking} 
                isPaid={isPaid} 
                onCancel={handleCancel}
                onPay={() => handlePay(booking)}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

export default BookingPanel;
