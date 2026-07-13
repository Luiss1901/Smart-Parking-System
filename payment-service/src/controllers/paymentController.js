const paymentService = require('../services/paymentService');

const createPaymentUrl = async (req, res, next) => {
    try {
        const { bookingId, amount, userId } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        
        const paymentUrl = await paymentService.createPaymentUrl(bookingId, userId, amount, ipAddr);
        res.json({ success: true, data: { paymentUrl } });
    } catch (err) {
        if (err.message.includes("Thiếu thông tin")) res.status(400);
        next(err);
    }
};

const vnpayReturn = (req, res, next) => {
    try {
        const result = paymentService.verifyReturn(req.query);
        if (result.isSuccess) {
            res.redirect(`https://localhost:443/?payment=success&bookingId=${result.bookingId}`);
        } else {
            res.redirect(`https://localhost:443/?payment=failed`);
        }
    } catch (err) {
        res.redirect(`https://localhost:443/?payment=error`);
    }
};

const vnpayIpn = async (req, res, next) => {
    try {
        const response = await paymentService.handleIpn(req.query);
        return res.json(response); // VNPay expects specific format, NOT { success, data }
    } catch (err) {
        console.error('IPN Error:', err);
        return res.json({ RspCode: '99', Message: 'Unknown error' });
    }
};

const calculate = (req, res, next) => {
    try {
        const { hours, vehicleType } = req.body;
        const total = paymentService.calculateTotal(hours, vehicleType);
        res.json({ success: true, data: { hours, vehicleType, total } });
    } catch (err) {
        next(err);
    }
};

const getAllPayments = async (req, res, next) => {
    try {
        const payments = await paymentService.getAllPayments();
        res.json({ success: true, data: payments });
    } catch (err) {
        next(err);
    }
};

const getHistoryByUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const history = await paymentService.getPaymentsHistory(userId);
        res.json({ success: true, data: history });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createPaymentUrl,
    vnpayReturn,
    vnpayIpn,
    calculate,
    getAllPayments,
    getHistoryByUser
};
