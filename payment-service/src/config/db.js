require('dotenv').config();
const { Pool } = require("pg");
const { VNPay, ignoreLogger, VnpLocale } = require('vnpay');

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id SERIAL PRIMARY KEY,
                "bookingId" INTEGER,
                "userId" INTEGER,
                amount REAL,
                "usdAmount" TEXT,
                "exchangeRate" TEXT,
                status TEXT,
                "vietQrUrl" TEXT,
                "paidAt" TEXT,
                "txnRef" TEXT UNIQUE
            )
        `);
        // Ensure userId exists if table already existed before the migration
        await poolPrimary.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS "userId" INTEGER;');
        await poolPrimary.query('CREATE INDEX IF NOT EXISTS idx_payments_userid ON payments("userId");');
        console.log("Payment DB initialized successfully");
    } catch (err) {
        console.error("Payment DB Init Error", err);
    }
};

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE || 'dummy',
    secureSecret: process.env.VNP_HASHSECRET || 'dummy',
    vnpayHost: 'https://sandbox.vnpayment.vn',
    testMode: true,
    hashAlgorithm: 'SHA512',
    enableLog: true,
    loggerFn: ignoreLogger,
});

module.exports = {
    poolPrimary,
    poolReplica,
    initDb,
    vnpay,
    VnpLocale
};
