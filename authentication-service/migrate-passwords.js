const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const migrate = async () => {
    try {
        console.log("Starting password migration...");
        const result = await poolReplica.query("SELECT id, password FROM accounts");
        const accounts = result.rows;
        
        let migratedCount = 0;
        
        for (const account of accounts) {
            // Check if it's already a bcrypt hash (starts with $2a$ or $2b$)
            if (account.password && !account.password.startsWith("$2b$") && !account.password.startsWith("$2a$")) {
                const hashedPassword = await bcrypt.hash(account.password, 10);
                await poolPrimary.query("UPDATE accounts SET password = $1 WHERE id = $2", [hashedPassword, account.id]);
                console.log(`Migrated password for user ID ${account.id}`);
                migratedCount++;
            }
        }
        
        console.log(`Migration completed successfully. Migrated ${migratedCount} accounts.`);
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit(0);
    }
};

migrate();
