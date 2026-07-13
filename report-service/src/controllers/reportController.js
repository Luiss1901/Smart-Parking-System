const reportService = require('../services/reportService');

const getRevenue = async (req, res, next) => {
    try {
        const data = await reportService.getRevenueReport();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

const getUsage = async (req, res, next) => {
    try {
        const data = await reportService.getUsageReport();
        res.json({ success: true, data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getRevenue,
    getUsage
};
