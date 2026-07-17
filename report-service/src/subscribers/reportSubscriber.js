const rabbitmq = require('../utils/rabbitmq');

const initSubscribers = () => {
    rabbitmq.subscribeEvent('payment.completed', 'q.report.payment_completed', async (data) => {
        try {
            console.log("[Report Subscriber] Payment completed:", data);
            // Example of what report service might do:
            // Insert into a materialized view, or update real-time metrics
            // Since report-service here is likely just querying bookingdb, 
            // maybe we just log it or update a local cache/table.
            console.log(`[Report Subscriber] Metrics updated for booking ${data.bookingId} with amount ${data.amount}.`);
        } catch (error) {
            console.error("[Report Subscriber] Error handling payment.completed:", error);
            throw error;
        }
    });
};

module.exports = { initSubscribers };
