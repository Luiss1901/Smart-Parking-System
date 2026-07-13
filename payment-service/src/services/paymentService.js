const { vnpay, VnpLocale } = require('../config/db');
const paymentRepository = require('../repositories/paymentRepository');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://booking-service:3000";
const USER_MANAGEMENT_SERVICE_URL = process.env.USER_MANAGEMENT_SERVICE_URL || "http://user-management-service:3000";

const createPaymentUrl = async (bookingId, userId, amount, ipAddr) => {
    if (!bookingId || !amount) {
        throw new Error("Thiếu thông tin bookingId hoặc amount");
    }

    const txnRef = bookingId + "_" + Date.now();

    const paymentUrl = vnpay.buildPaymentUrl({
        vnp_Amount: amount,
        vnp_IpAddr: ipAddr,
        vnp_TxnRef: txnRef,
        vnp_OrderInfo: `Thanh toan do xe Booking ID ${bookingId}`,
        vnp_OrderType: 'other',
        vnp_ReturnUrl: process.env.VNP_RETURNURL || 'http://localhost:8080/payments/vnpay-return',
        vnp_Locale: VnpLocale.VN,
    });

    await paymentRepository.createPayment(bookingId, userId, amount, txnRef);
    return paymentUrl;
};

const handleIpn = async (query) => {
    const verify = vnpay.verifyIpnCall(query);
    if (!verify.isSuccess) {
        return { RspCode: '97', Message: 'Invalid signature' };
    }

    const txnRef = query.vnp_TxnRef;
    const bookingId = txnRef.split('_')[0];
    const amountStr = query.vnp_Amount;
    const amount = parseInt(amountStr) / 100;

    const payment = await paymentRepository.getPaymentByTxnRef(txnRef);

    if (!payment) {
        return { RspCode: '01', Message: 'Order Not Found' };
    }
    if (payment.status !== 'PENDING') {
        return { RspCode: '02', Message: 'Order already confirmed' };
    }
    if (payment.amount !== amount) {
        return { RspCode: '04', Message: 'Invalid amount' };
    }

    if (query.vnp_ResponseCode === '00' && query.vnp_TransactionStatus === '00') {
        let usdAmount = (amount / 25400).toFixed(2);
        const paidAt = new Date().toISOString();

        await paymentRepository.updatePaymentStatus(txnRef, 'PAID', usdAmount, paidAt);

        // Notify user
        try {
            const bookingRes = await fetch(`${BOOKING_SERVICE_URL}/`);
            const bookingBody = await bookingRes.json();
            const bookings = bookingBody.success !== undefined ? bookingBody.data : bookingBody;
            const booking = bookings.find(b => b.id == bookingId);

            let userEmail = "member1@example.com";
            let userName = "Khách";
            
            if (booking) {
                const authRes = await fetch(`${USER_MANAGEMENT_SERVICE_URL}/`);
                const authBody = await authRes.json();
                const users = authBody.success !== undefined ? authBody.data : authBody;
                const user = users.find(u => u.id == booking.userId);
                if (user) {
                    userEmail = user.email;
                    userName = user.name;
                }
            }

            await fetch(`${NOTIFICATION_SERVICE_URL}/send-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: userEmail,
                    subject: "Smart Parking - Hóa đơn thanh toán thành công",
                    html: `<p>Xin chào ${userName},</p>
                           <p>Hóa đơn đặt chỗ xe (Booking #${bookingId}) đã thanh toán <b>THÀNH CÔNG</b> qua cổng VNPay.</p>
                           <p>Số tiền: <b>${amount.toLocaleString()}đ</b></p>
                           <p>Mã giao dịch: ${txnRef}</p>
                           <p>Cảm ơn bạn đã sử dụng dịch vụ.</p>`
                })
            });
        } catch(err) {
            console.log("Error orchestrating user email notify in payment-service IPN:", err.message);
        }
        return { RspCode: '00', Message: 'Confirm Success' };
    } else {
        await paymentRepository.updatePaymentStatus(txnRef, 'FAILED');
        return { RspCode: '00', Message: 'Confirm Success (Failed Transaction)' };
    }
};

const verifyReturn = (query) => {
    const verify = vnpay.verifyReturnUrl(query);
    const txnRef = query.vnp_TxnRef;
    const bookingId = txnRef ? txnRef.split('_')[0] : '';
    
    return {
        isSuccess: verify.isSuccess,
        bookingId
    };
};

const calculateTotal = (hours, vehicleType) => {
    let pricePerHour = vehicleType === "CAR" ? 20000 : 5000;
    return hours * pricePerHour;
};

const getAllPayments = async () => {
    return await paymentRepository.getAllPayments();
};

const getPaymentsHistory = async (userId) => {
    return await paymentRepository.getPaymentsByUserId(userId);
};

module.exports = {
    createPaymentUrl,
    handleIpn,
    verifyReturn,
    calculateTotal,
    getAllPayments,
    getPaymentsHistory
};
