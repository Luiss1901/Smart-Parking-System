const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "parking-service" }));

const JWT_SECRET = process.env.JWT_SECRET || "smart-parking-secret";

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Vui lòng đăng nhập" });
    const token = authHeader.split(" ")[1];
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Token không hợp lệ" });
        req.user = decoded;
        next();
    });
};

const requireAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ message: "Không có quyền truy cập (Yêu cầu quyền ADMIN)" });
    }
};

app.use(cors());
app.use(express.json());

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS slots (
                id SERIAL PRIMARY KEY,
                code TEXT UNIQUE,
                status TEXT,
                type TEXT
            )
        `);
        await poolPrimary.query('ALTER TABLE slots ADD COLUMN IF NOT EXISTS area TEXT;');
        
        const countRes = await poolPrimary.query("SELECT COUNT(*) as count FROM slots");
        if (parseInt(countRes.rows[0].count) === 0) {
            await poolPrimary.query("INSERT INTO slots (code, area, status, type) VALUES ('A01', 'Khu A', 'AVAILABLE', 'CAR')");
            await poolPrimary.query("INSERT INTO slots (code, area, status, type) VALUES ('A02', 'Khu A', 'AVAILABLE', 'CAR')");
            await poolPrimary.query("INSERT INTO slots (code, area, status, type) VALUES ('A03', 'Khu A', 'OCCUPIED', 'MOTORBIKE')");
            await poolPrimary.query("INSERT INTO slots (code, area, status, type) VALUES ('B01', 'Khu B', 'AVAILABLE', 'CAR')");
        }
        
        console.log("Parking DB initialized successfully");
    } catch (err) {
        console.error("Parking DB Init Error", err);
    }
};
setTimeout(initDb, 5000);

const { initSubscribers } = require('./src/subscribers/parkingSubscriber');
initSubscribers();

app.get("/slots", async (req, res) => {
  try {
      const slots = await poolReplica.query("SELECT * FROM slots");
      res.json(slots.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.get("/slots/available", async (req, res) => {
  try {
      const slots = await poolReplica.query("SELECT * FROM slots WHERE status = 'AVAILABLE'");
      res.json(slots.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.post("/slots", verifyToken, requireAdmin, async (req, res) => {
    const { code, area, type } = req.body;
    if (!code || !type) return res.status(400).json({ message: "Thiếu code hoặc type" });
    try {
        const result = await poolPrimary.query(
            "INSERT INTO slots (code, area, status, type) VALUES ($1, $2, 'AVAILABLE', $3) RETURNING *",
            [code, area || '', type]
        );
        res.status(201).json({ message: "Đã tạo slot thành công", slot: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/slots/:id", verifyToken, requireAdmin, async (req, res) => {
    const { code, area, type } = req.body;
    const slotId = req.params.id;
    try {
        const result = await poolPrimary.query(
            "UPDATE slots SET code = COALESCE($1, code), area = COALESCE($2, area), type = COALESCE($3, type) WHERE id = $4 RETURNING *",
            [code, area, type, slotId]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });
        res.json({ message: "Cập nhật thành công", slot: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete("/slots/:id", verifyToken, requireAdmin, async (req, res) => {
    const slotId = req.params.id;
    try {
        const slotRes = await poolReplica.query("SELECT * FROM slots WHERE id = $1", [slotId]);
        const slot = slotRes.rows[0];
        if (!slot) return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });
        
        if (slot.status !== 'AVAILABLE') {
            return res.status(400).json({ message: "Không thể xóa chỗ đang có xe/đã đặt" });
        }
        
        await poolPrimary.query("DELETE FROM slots WHERE id = $1", [slotId]);
        res.json({ message: "Đã xóa chỗ đỗ thành công" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put("/slots/:id/reserve", async (req, res) => {
  const slotId = req.params.id;
  try {
      const slotRes = await poolReplica.query("SELECT * FROM slots WHERE id = $1", [slotId]);
      const slot = slotRes.rows[0];

      if (!slot) return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });
      if (slot.status !== "AVAILABLE") return res.status(400).json({ message: "Chỗ đỗ không còn trống" });

      const updatedRes = await poolPrimary.query(
          "UPDATE slots SET status = 'RESERVED' WHERE id = $1 RETURNING *",
          [slotId]
      );
      res.json({ message: "Đã giữ chỗ", slot: updatedRes.rows[0] });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.put("/slots/:id/release", async (req, res) => {
  const slotId = req.params.id;
  try {
      const slotRes = await poolReplica.query("SELECT * FROM slots WHERE id = $1", [slotId]);
      const slot = slotRes.rows[0];

      if (!slot) return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });

      const updatedRes = await poolPrimary.query(
          "UPDATE slots SET status = 'AVAILABLE' WHERE id = $1 RETURNING *",
          [slotId]
      );
      res.json({ message: "Đã trả chỗ", slot: updatedRes.rows[0] });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

app.put("/slots/:id/status", async (req, res) => {
  const slotId = req.params.id;
  try {
      const slotRes = await poolReplica.query("SELECT * FROM slots WHERE id = $1", [slotId]);
      const slot = slotRes.rows[0];

      if (!slot) return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });

      const { status } = req.body;
      if (!status || !["AVAILABLE", "OCCUPIED", "RESERVED"].includes(status)) {
        return res.status(400).json({ message: "Trạng thái không hợp lệ" });
      }

      const updatedRes = await poolPrimary.query(
          "UPDATE slots SET status = $1 WHERE id = $2 RETURNING *",
          [status, slotId]
      );
      res.json({ message: `Đã cập nhật trạng thái ô đỗ thành ${status}`, slot: updatedRes.rows[0] });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Parking Service running on port ${PORT}`);
});
