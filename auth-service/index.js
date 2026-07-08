const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let users = [];

app.post("/register", (req, res) => {
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
  res.json({ message: "Đăng ký thành công", user });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: "Sai tài khoản hoặc mật khẩu" });
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

app.listen(3000, () => {
  console.log("Auth Service running on port 3000");
});
