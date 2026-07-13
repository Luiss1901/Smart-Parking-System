const reportRepository = require('../repositories/reportRepository');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || "http://payment-service:3000";
const PARKING_SERVICE_URL = process.env.PARKING_SERVICE_URL || "http://parking-service:3000";

const getRevenueReport = async () => {
    let totalRevenue = 0;
    let totalPayments = 0;

    const response = await fetch(`${PAYMENT_SERVICE_URL}/`);
    if (!response.ok) {
        throw new Error(`Không lấy được dữ liệu từ payment-service: ${response.status} ${response.statusText}`);
    }
    
    const body = await response.json();
    // Support both old array format and new layered architecture { success, data } format
    const payments = body.success !== undefined ? body.data : body;
    
    payments.forEach(p => {
        totalRevenue += p.amount;
        totalPayments += 1;
    });

    await reportRepository.logReportGeneration('revenue');

    return {
        date: new Date().toISOString().slice(0, 10),
        totalRevenue,
        totalPayments
    };
};

const getUsageReport = async () => {
    const response = await fetch(`${PARKING_SERVICE_URL}/slots`);
    if (!response.ok) {
        throw new Error(`Không lấy được dữ liệu từ parking-service: ${response.status} ${response.statusText}`);
    }

    const body = await response.json();
    const slots = body.success !== undefined ? body.data : body;
    
    const totalSlots = slots.length;
    const occupiedSlots = slots.filter(s => s.status === "OCCUPIED" || s.status === "RESERVED").length;
    const availableSlots = slots.filter(s => s.status === "AVAILABLE").length;

    await reportRepository.logReportGeneration('usage');

    const usageRate = totalSlots > 0 ? `${Math.round((occupiedSlots / totalSlots) * 100)}%` : "0%";

    return {
        totalSlots,
        occupiedSlots,
        availableSlots,
        usageRate
    };
};

module.exports = {
    getRevenueReport,
    getUsageReport
};
