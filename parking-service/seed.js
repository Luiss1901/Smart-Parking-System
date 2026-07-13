const { Pool } = require("pg");

// Use the primary DB URL from environment or default local URL
const connectionString = process.env.POSTGRES_PRIMARY_URL || "postgresql://myuser:mypassword@localhost:5434/parkingdb";
const pool = new Pool({ connectionString });

const slots = [];

// Helper to generate slots
const generateZone = (prefix, count) => {
  for (let i = 1; i <= count; i++) {
    const code = `${prefix}${i.toString().padStart(2, '0')}`;
    // Randomize type: 70% CAR, 30% MOTORBIKE
    const type = Math.random() < 0.7 ? 'CAR' : 'MOTORBIKE';
    // Randomize status: 70% AVAILABLE, 20% OCCUPIED, 10% RESERVED
    const rand = Math.random();
    let status = 'AVAILABLE';
    if (rand > 0.7 && rand <= 0.9) status = 'OCCUPIED';
    else if (rand > 0.9) status = 'RESERVED';

    slots.push({ code, status, type });
  }
};

// Generate zones
generateZone('A', 10);
generateZone('B', 10);
generateZone('C', 10);
generateZone('D', 5);

const seed = async () => {
  try {
    console.log("Connecting to DB...");
    
    // Ensure table exists and has type column
    await pool.query(`
      CREATE TABLE IF NOT EXISTS slots (
          id SERIAL PRIMARY KEY,
          code TEXT UNIQUE,
          status TEXT
      )
    `);
    
    // Add type column if missing (for existing tables)
    await pool.query(`ALTER TABLE slots ADD COLUMN IF NOT EXISTS type TEXT`);

    // Set default type for existing rows if null
    await pool.query(`UPDATE slots SET type = 'CAR' WHERE type IS NULL AND code LIKE 'A%'`);
    await pool.query(`UPDATE slots SET type = 'MOTORBIKE' WHERE type IS NULL`);

    console.log(`Seeding ${slots.length} slots...`);
    
    for (const slot of slots) {
      await pool.query(
        `INSERT INTO slots (code, status, type) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (code) DO UPDATE 
         SET type = EXCLUDED.type`,
        [slot.code, slot.status, slot.type]
      );
    }

    console.log("Seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    await pool.end();
  }
};

seed();
