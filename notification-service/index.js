const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let notifications = [];

app.post("/notify", (req, res) => {
  const { type, message } = req.body;

  if (!type || !message) {
    return res.status(400).json({ message: "Thiếu thông tin thông báo" });
  }

  const notification = {
    id: notifications.length + 1,
    type,
    message,
    sentAt: new Date()
  };

  notifications.push(notification);
  console.log(`[Notification Service] Sent ${type}: ${message}`);

  res.json({
    message: "Gửi thông báo thành công",
    notification
  });
});

app.get("/", (req, res) => {
  res.json(notifications);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});
