const axios = require('axios');
const bookingRepository = require('../repositories/bookingRepository');
const rabbitmq = require('../utils/rabbitmq');

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
    
    // Publish booking created event
    try {
        await rabbitmq.publishEvent('booking.created', { booking });
    } catch(err) {
        console.error("Error publishing booking.created event:", err.message);
    }
    
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

const extendBooking = async (id, newEndTime) => {
    const booking = await bookingRepository.getBookingById(id);
    if (!booking) {
        const error = new Error('Booking not found');
        error.status = 404;
        throw error;
    }

    if (booking.status === 'cancelled') {
        const error = new Error('Cannot extend a cancelled booking');
        error.status = 400;
        throw error;
    }
    
    if (new Date(newEndTime) <= new Date(booking.endTime)) {
        const error = new Error('New end time must be after current end time');
        error.status = 400;
        throw error;
    }

    const overlaps = await bookingRepository.getOverlappingBookings(booking.slotId, id, booking.startTime, newEndTime);
    if (overlaps.length > 0) {
        const error = new Error('Slot is already booked for the requested extension period');
        error.status = 409;
        throw error;
    }

    const updatedBooking = await bookingRepository.updateBookingEndTime(id, newEndTime);
    return updatedBooking;
};

module.exports = {
    getAllBookings,
    getBookingsByUser,
    createBooking,
    cancelBooking,
    extendBooking
};
