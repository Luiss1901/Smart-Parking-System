const rabbitmq = require('../utils/rabbitmq');
const { Pool } = require('pg');

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });

const initSubscribers = () => {
    rabbitmq.subscribeEvent('device.plate-detected', 'q.parking.plate_detected', async (data) => {
        try {
            console.log("[Parking Subscriber] Plate detected:", data);
            const { slotId, status } = data;
            
            await poolPrimary.query(
                "UPDATE slots SET status = $1 WHERE id = $2",
                [status, slotId]
            );
            console.log(`[Parking Subscriber] Slot ${slotId} status updated to ${status}.`);
        } catch (error) {
            console.error("[Parking Subscriber] Error handling device.plate-detected:", error);
            throw error; // Rethrow to trigger DLQ if needed
        }
    });

    rabbitmq.subscribeEvent('payment.refunded', 'q.parking.payment_refunded', async (data) => {
        try {
            console.log("[Parking Subscriber] Payment refunded:", data);
            // We need slotId. If passed in event:
            if (data.slotId) {
                await poolPrimary.query(
                    "UPDATE slots SET status = 'AVAILABLE' WHERE id = $1",
                    [data.slotId]
                );
                console.log(`[Parking Subscriber] Slot ${data.slotId} released due to refund.`);
            } else {
                console.log(`[Parking Subscriber] No slotId provided in event, cannot release slot directly.`);
            }
        } catch (error) {
            console.error("[Parking Subscriber] Error handling payment.refunded:", error);
            throw error;
        }
    });
};

module.exports = { initSubscribers };
