const bookingService = require('../services/bookingService');

const getAllBookings = async (req, res, next) => {
    try {
        const bookings = await bookingService.getAllBookings();
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};

const getBookingsByUser = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        const bookings = await bookingService.getBookingsByUser(userId);
        res.json({ success: true, data: bookings });
    } catch (err) {
        next(err);
    }
};

const createBooking = async (req, res, next) => {
    try {
        const booking = await bookingService.createBooking(req.body);
        res.status(201).json({ success: true, data: booking });
    } catch (err) {
        if (err.message === 'Missing required fields') {
            res.status(400);
        }
        next(err);
    }
};

const cancelBooking = async (req, res, next) => {
    try {
        const bookingId = parseInt(req.params.id, 10);
        const booking = await bookingService.cancelBooking(bookingId);
        res.json({ success: true, message: 'Booking cancelled successfully', data: booking });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllBookings,
    getBookingsByUser,
    createBooking,
    cancelBooking
};
