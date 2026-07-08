const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";

let payments = [];

app.post("/calculate", (req, res) => {
  const { hours, vehicleType } = req.body;

  let pricePerHour = vehicleType === "CAR" ? 20000 : 5000;
  let total = hours * pricePerHour;

  res.json({
    hours,
    vehicleType,
    total
  });
});

app.post("/pay", (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ message: "Thiếu thông tin thanh toán" });
  }

  const payment = {
    id: payments.length + 1,
    bookingId,
    amount,
    status: "PAID",
    paidAt: new Date()
  };

  payments.push(payment);

  // Call Notification Service
  try {
    fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Email",
        message: `Hóa đơn thanh toán thành công cho Booking ID ${bookingId}. Số tiền: ${amount.toLocaleString()}đ.`
      })
    }).catch(err => console.log("Silent error calling notify in pay-service:", err.message));
  } catch(e) {}

  res.json({
    message: "Thanh toán thành công",
    payment
  });
});

app.get("/", (req, res) => {
  res.json(payments);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Payment Service running on port ${PORT}`);
});
