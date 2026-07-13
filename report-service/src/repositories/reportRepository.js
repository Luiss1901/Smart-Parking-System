const { poolPrimary } = require('../config/db');

const logReportGeneration = async (reportType) => {
    try {
        await poolPrimary.query(
            'INSERT INTO report_logs ("reportType", "generatedAt") VALUES ($1, $2)',
            [reportType, new Date().toISOString()]
        );
    } catch (e) {
        console.error("Failed to log report generation", e);
    }
};

module.exports = {
    logReportGeneration
};
