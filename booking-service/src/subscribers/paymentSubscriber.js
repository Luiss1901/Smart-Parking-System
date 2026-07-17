const rabbitmq = require('../utils/rabbitmq');
const bookingRepository = require('../repositories/bookingRepository');
const bookingService = require('../services/bookingService');

const initSubscribers = () => {
    rabbitmq.subscribeEvent('payment.completed', 'q.booking.payment_completed', async (data) => {
        try {
            console.log("[Booking Subscriber] Payment completed:", data);
            await bookingRepository.updateBookingStatus(data.bookingId, 'paid');
            console.log(`[Booking Subscriber] Booking ${data.bookingId} status updated to paid.`);
        } catch (error) {
            console.error("[Booking Subscriber] Error handling payment.completed:", error);
            throw error;
        }
    });

    rabbitmq.subscribeEvent('payment.refunded', 'q.booking.payment_refunded', async (data) => {
        try {
            console.log("[Booking Subscriber] Payment refunded:", data);
            // Cancel booking and release slot
            await bookingService.cancelBooking(data.bookingId);
            console.log(`[Booking Subscriber] Booking ${data.bookingId} cancelled and slot released due to refund.`);
        } catch (error) {
            console.error("[Booking Subscriber] Error handling payment.refunded:", error);
            throw error;
        }
    });
};

module.exports = { initSubscribers };
