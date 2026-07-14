const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const axios = require("axios");
const bcrypt = require("bcrypt");

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "authentication-service" }));

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "smart-parking-secret";
const USER_MANAGEMENT_SERVICE_URL = process.env.USER_MANAGEMENT_SERVICE_URL || "http://user-management-service:3000";

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const otpStore = {};

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS accounts (
                id SERIAL PRIMARY KEY,
                email TEXT UNIQUE,
                password TEXT,
                role TEXT
            )
        `);
        console.log("Auth DB initialized successfully");
    } catch (err) {
        console.error("Auth DB Init Error", err);
    }
};
setTimeout(initDb, 5000);

app.post("/register", async (req, res) => {
  const { email, password, role, name, plateNumber } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Thiếu email hoặc mật khẩu" });
  try {
    const existing = await poolReplica.query('SELECT id FROM accounts WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ message: "Email đã tồn tại" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertRes = await poolPrimary.query(
        'INSERT INTO accounts (email, password, role) VALUES ($1, $2, $3) RETURNING id', 
        [email, hashedPassword, role || "customer"]
    );
    const newAccountId = insertRes.rows[0].id;

    // Create profile in user-management-service
    await axios.post(`${USER_MANAGEMENT_SERVICE_URL}/`, {
        id: newAccountId,
        email: email,
        name: name || "Khách",
        plateNumber: plateNumber || "",
        role: role || "customer"
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = otp;
    try {
        await axios.post('http://notification-service:3000/notify', {
            type: 'Email',
            to: email,
            subject: 'Mã xác nhận Smart Parking',
            message: `Mã OTP xác nhận tài khoản của bạn là: ${otp}`
        });
    } catch (e) {
        console.error("Gửi OTP thất bại:", e.message);
    }

    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
      const userRes = await poolReplica.query('SELECT * FROM accounts WHERE email = $1', [email]);
      const account = userRes.rows[0];
      if (!account) return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
      
      let isMatch = false;
      if (!account.password.startsWith('$2b$') && !account.password.startsWith('$2a$') && !account.password.startsWith('$2y$')) {
          if (account.password === password) {
              isMatch = true;
              const hashedMigrated = await bcrypt.hash(password, 10);
              await poolPrimary.query('UPDATE accounts SET password = $1 WHERE id = $2', [hashedMigrated, account.id]);
          }
      } else {
          isMatch = await bcrypt.compare(password, account.password);
      }
      if (!isMatch) return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
      let profile = {};
      try {
          const profileRes = await axios.get(`${USER_MANAGEMENT_SERVICE_URL}/${account.id}`);
          profile = profileRes.data;
      } catch (e) {
          console.log("Could not fetch profile", e.message);
      }

      const user = { ...account, ...profile };
      
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ message: "Đăng nhập thành công", token, user });
  } catch (err) {
      res.status(500).json({ message: "Lỗi hệ thống" });
  }
});

app.put("/change-password/:id", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.params.id;
  try {
      const userRes = await poolReplica.query('SELECT * FROM accounts WHERE id = $1', [userId]);
      const account = userRes.rows[0];
      if (!account) return res.status(404).json({ message: "Không tìm thấy người dùng" });

      let isMatch = false;
      if (!account.password.startsWith('$2b$') && !account.password.startsWith('$2a$') && !account.password.startsWith('$2y$')) {
          if (account.password === oldPassword) {
              isMatch = true;
          }
      } else {
          isMatch = await bcrypt.compare(oldPassword, account.password);
      }

      if (!isMatch) return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await poolPrimary.query('UPDATE accounts SET password = $1 WHERE id = $2', [hashedNewPassword, userId]);
      
      res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
      res.status(500).json({ message: "Lỗi hệ thống", error: err.message });
  }
});

app.post("/verify", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Thiếu thông tin" });
  
  if (otpStore[email] && otpStore[email] === otp) {
      delete otpStore[email];
      return res.json({ valid: true, message: "Xác thực thành công" });
  }
  return res.status(400).json({ valid: false, message: "Mã OTP không đúng hoặc đã hết hạn" });
});

app.get("/verify-token", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ valid: false, message: "Không có token" });
  const token = authHeader.split(" ")[1];
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ valid: false, message: "Token không hợp lệ hoặc đã hết hạn" });
      res.json({ valid: true, user: decoded });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Authentication Service running on port ${PORT}`);
});
