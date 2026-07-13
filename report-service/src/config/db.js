const { Pool } = require("pg");

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS report_logs (
                id SERIAL PRIMARY KEY,
                "reportType" TEXT,
                "generatedAt" TEXT
            )
        `);
        console.log("Report DB initialized successfully");
    } catch (err) {
        console.error("Report DB Init Error", err);
    }
};

module.exports = {
    poolPrimary,
    poolReplica,
    initDb
};
