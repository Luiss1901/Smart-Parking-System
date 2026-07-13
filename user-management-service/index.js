const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "user-management-service" }));

app.use(cors());
app.use(express.json());

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS profiles (
                id INTEGER PRIMARY KEY,
                email TEXT,
                name TEXT,
                "plateNumber" TEXT,
                role TEXT,
                status TEXT
            )
        `);
        console.log("User DB initialized successfully");
    } catch (err) {
        console.error("User DB Init Error", err);
    }
};
setTimeout(initDb, 5000);

app.post("/", async (req, res) => {
    // Called by auth-service on register
    const { id, email, name, plateNumber, role } = req.body;
    try {
        await poolPrimary.query(
            'INSERT INTO profiles (id, email, name, "plateNumber", role, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [id, email, name, plateNumber, role, 'active']
        );
        res.status(201).json({ message: "Profile created" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/", async (req, res) => {
    try {
        const result = await poolReplica.query('SELECT * FROM profiles');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/:id", async (req, res) => {
    try {
        const result = await poolReplica.query('SELECT * FROM profiles WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/:id", async (req, res) => {
  const { name, plateNumber } = req.body;
  const userId = req.params.id;
  
  if (!name || !plateNumber) {
    return res.status(400).json({ message: "Thiếu thông tin cập nhật" });
  }

  try {
      const updateRes = await poolPrimary.query(
          'UPDATE profiles SET name = $1, "plateNumber" = $2 WHERE id = $3 RETURNING *',
          [name, plateNumber, userId]
      );
      if (updateRes.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy người dùng" });
      res.json({ message: "Cập nhật thành công", user: updateRes.rows[0] });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`User Management Service running on port ${PORT}`);
});
