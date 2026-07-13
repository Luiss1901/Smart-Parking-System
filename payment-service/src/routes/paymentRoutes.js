const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create-payment-url', paymentController.createPaymentUrl);
router.get('/vnpay-return', paymentController.vnpayReturn);
router.get('/vnpay-ipn', paymentController.vnpayIpn);
router.post('/calculate', paymentController.calculate);
router.get('/history/:userId', paymentController.getHistoryByUser);
router.get('/', paymentController.getAllPayments);

module.exports = router;
