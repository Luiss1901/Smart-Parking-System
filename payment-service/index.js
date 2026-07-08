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

app.post("/pay", async (req, res) => {
  const { bookingId, amount } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ message: "Thiếu thông tin thanh toán" });
  }

  // 1. Call Live Currency exchange API (External Backend API)
  let usdAmount = 0;
  let exchangeRate = 25400; // default fallback
  try {
    const exchangeRes = await fetch("https://open.er-api.com/v6/latest/VND");
    if (exchangeRes.ok) {
      const data = await exchangeRes.json();
      exchangeRate = data.rates.USD;
      usdAmount = (amount * exchangeRate).toFixed(2);
    } else {
      usdAmount = (amount / 25400).toFixed(2);
    }
  } catch (err) {
    console.log("[Payment Service] Warning: Can't fetch external exchange rate API, using fallback. Error:", err.message);
    usdAmount = (amount / 25400).toFixed(2);
  }

  // 2. Generate scannable VietQR URL (External Bank QR API)
  const vietQrUrl = `https://img.vietqr.io/image/MB-123456789-compact.png?amount=${amount}&addInfo=Thanh%20toan%20Smart%20Parking%20Booking%20${bookingId}&accountName=SMART%20PARKING%20SYSTEM`;

  const payment = {
    id: payments.length + 1,
    bookingId,
    amount,
    usdAmount,
    exchangeRate: (1 / exchangeRate).toFixed(0),
    status: "PAID",
    vietQrUrl,
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
        message: `Hóa đơn đã THANH TOÁN THÀNH CÔNG (External Gateway). Số tiền: ${amount.toLocaleString()}đ (~$${usdAmount} USD).`
      })
    }).catch(err => console.log("Silent error calling notify in pay-service:", err.message));
  } catch(e) {}

  res.json({
    message: "Thanh toán thành công qua cổng liên kết",
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
