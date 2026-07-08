const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";

let users = [];

app.post("/register", async (req, res) => {
  const { name, email, password, plateNumber } = req.body;

  if (!name || !email || !password || !plateNumber) {
    return res.status(400).json({ message: "Thiếu thông tin đăng ký" });
  }

  const existed = users.find(u => u.email === email);
  if (existed) {
    return res.status(400).json({ message: "Email đã tồn tại" });
  }

  const user = {
    id: users.length + 1,
    name,
    email,
    password,
    plateNumber,
    role: "USER"
  };

  users.push(user);

  // Send Email Notification on registration
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Email",
        message: `Gửi tới: ${email} (${name})\nNội dung: Chúc mừng bạn đã đăng ký tài khoản Smart Parking thành công!\nBiển số xe đăng ký: ${plateNumber}.`
      })
    });
  } catch (err) {
    console.log("Error sending registration notification:", err.message);
  }

  res.json({ message: "Đăng ký thành công", user });
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
  }

  // Send Email Notification on login
  try {
    const timeStr = new Date().toLocaleString("vi-VN");
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Email",
        message: `Gửi tới: ${email} (${user.name})\nNội dung: Tài khoản của bạn đã được đăng nhập thành công vào hệ thống Smart Parking lúc ${timeStr}.`
      })
    });
  } catch (err) {
    console.log("Error sending login notification:", err.message);
  }

  res.json({
    message: "Đăng nhập thành công",
    token: "fake-jwt-token",
    user
  });
});

app.get("/users", (req, res) => {
  res.json(users);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
