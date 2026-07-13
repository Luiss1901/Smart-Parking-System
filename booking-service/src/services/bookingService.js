const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');

const getAllBookings = async () => {
    return await bookingRepository.getAllBookings();
};

const getBookingsByUser = async (userId) => {
    return await bookingRepository.getBookingsByUser(userId);
};

const reserveSlot = async (slotId) => {
    await axios.put(`http://parking-service:3000/slots/${slotId}/reserve`);
};

const releaseSlot = async (slotId) => {
    await axios.put(`http://parking-service:3000/slots/${slotId}/release`);
};

const createBooking = async (data) => {
    const { userId, slotId, startTime, endTime } = data;
    if (!userId || !slotId || !startTime || !endTime) {
        throw new Error('Missing required fields');
    }
    
    await reserveSlot(slotId);
    const booking = await bookingRepository.createBooking(userId, slotId, startTime, endTime);
    return booking;
};

const cancelBooking = async (id) => {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
    }

    if (booking.status === 'cancelled') {
        const error = new Error('Booking already cancelled');
        error.status = 400;
        throw error;
    }

    await releaseSlot(booking.slotId);
    const updatedBooking = await bookingRepository.cancelBooking(id);
    return updatedBooking;
};

module.exports = {
    getAllBookings,
    getBookingsByUser,
    createBooking,
    cancelBooking
};
