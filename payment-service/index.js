const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || "http://booking-service:3000";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3000";

let payments = [];

app.post("/vnpay_url", (req, res) => {
  const { bookingId, amount } = req.body;
  if (!bookingId || !amount) {
    return res.status(400).json({ message: "Thiếu thông tin bookingId hoặc amount" });
  }

  const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  
  const tmnCode = "2QXUIB0A";
  const secretKey = "MSDCOALVXZXPZJOFMGSXVORMTTRWJQIH";
  let vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const returnUrl = "http://localhost:5173/";

  const date = new Date();
  const createDate = date.getFullYear().toString() +
    (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0') +
    date.getHours().toString().padStart(2, '0') +
    date.getMinutes().toString().padStart(2, '0') +
    date.getSeconds().toString().padStart(2, '0');

  const txnRef = bookingId + "_" + Date.now();

  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = 'vn';
  vnp_Params['vnp_CurrCode'] = 'VND';
  vnp_Params['vnp_TxnRef'] = txnRef;
  vnp_Params['vnp_OrderInfo'] = `Thanh toan do xe Booking ID ${bookingId}`;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;

  // Sort parameters alphabetically
  const sortedParams = {};
  const keys = Object.keys(vnp_Params).sort();
  for (let key of keys) {
    sortedParams[key] = encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+");
  }

  // Build query signData
  const signData = Object.keys(vnp_Params).sort()
    .map(key => `${key}=${encodeURIComponent(vnp_Params[key]).replace(/%20/g, "+")}`)
    .join('&');

  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
  
  sortedParams['vnp_SecureHash'] = signed;
  
  const queryStr = Object.entries(sortedParams)
    .map(([key, val]) => `${key}=${val}`)
    .join('&');

  const finalUrl = vnpUrl + '?' + queryStr;
  res.json({ paymentUrl: finalUrl });
});

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

  // Call Notification Service with resolved user email
  try {
    // 1. Fetch booking details from Booking Service
    const bookingRes = await fetch(`${BOOKING_SERVICE_URL}/`);
    const bookings = await bookingRes.json();
    const booking = bookings.find(b => b.id == bookingId);

    let userEmail = "member1@example.com"; // default fallback
    let userName = "Khách";
    if (booking) {
      // 2. Fetch user details from Auth Service
      const authRes = await fetch(`${AUTH_SERVICE_URL}/users`);
      const users = await authRes.json();
      const user = users.find(u => u.id == booking.userId);
      if (user) {
        userEmail = user.email;
        userName = user.name;
      }
    }

    // 3. Send email via Notification Service
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "Email",
        message: `Gửi tới: ${userEmail} (${userName})\nNội dung: Hóa đơn đã THANH TOÁN THÀNH CÔNG qua cổng VNPay. Mã giao dịch: #${payment.id}. Số tiền: ${amount.toLocaleString()}đ (~$${usdAmount} USD).`
      })
    });
  } catch(err) {
    console.log("Error orchestrating user email notify in payment-service:", err.message);
    
    // Fallback notification
    try {
      fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Email",
          message: `Hóa đơn đã THANH TOÁN THÀNH CÔNG (External Gateway). Số tiền: ${amount.toLocaleString()}đ (~$${usdAmount} USD).`
        })
      });
    } catch(e) {}
  }

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
