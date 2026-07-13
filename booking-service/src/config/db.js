const { Pool } = require('pg');

const poolPrimary = new Pool({
    connectionString: process.env.POSTGRES_PRIMARY_URL || 'postgres://repl_user:repl_password@booking-db-primary:5432/bookingdb'
});

const poolReplica = new Pool({
    connectionString: process.env.POSTGRES_REPLICA_URL || 'postgres://repl_user:repl_password@booking-db-replica:5432/bookingdb'
});

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS bookings (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER,
                "slotId" INTEGER,
                "startTime" TEXT,
                "endTime" TEXT,
                status TEXT
            )
        `);
        console.log("Database initialized successfully on Primary");
    } catch (err) {
        console.error("Failed to initialize database", err);
    }
};

module.exports = {
    poolPrimary,
    poolReplica,
    initDb
};
