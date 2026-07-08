const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

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
