const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, requireAdmin, bookingController.getAllBookings);
router.get('/user/:userId', verifyToken, bookingController.getBookingsByUser);
router.post('/', verifyToken, bookingController.createBooking);
router.put('/:id/cancel', verifyToken, bookingController.cancelBooking);

router.put('/:id/extend', verifyToken, bookingController.extendBooking);

module.exports = router;
