const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const axios = require("axios");

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "user-management-service" }));

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

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://authentication-service:3000";

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

app.get("/", verifyToken, requireAdmin, async (req, res) => {
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

app.put("/:id/change-password", verifyToken, async (req, res) => {
    if (req.user.id != req.params.id) {
        return res.status(403).json({ message: "Không có quyền thay đổi mật khẩu của người khác" });
    }
    try {
        const response = await axios.put(`${AUTH_SERVICE_URL}/change-password/${req.params.id}`, req.body);
        res.json(response.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { message: "Lỗi kết nối đến Auth Service" });
    }
});

app.put("/:id", verifyToken, async (req, res) => {
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
