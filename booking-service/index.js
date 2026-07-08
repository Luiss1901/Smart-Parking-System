const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PARKING_SERVICE_URL = process.env.PARKING_SERVICE_URL || "http://parking-service:3000";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://notification-service:3000";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:3000";

let bookings = [];

app.post("/", async (req, res) => {
  const { userId, slotId, startTime, endTime } = req.body;

  if (!userId || !slotId || !startTime || !endTime) {
    return res.status(400).json({ message: "Thiếu thông tin đặt chỗ" });
  }

  try {
    const response = await fetch(`${PARKING_SERVICE_URL}/slots/${slotId}/reserve`, {
      method: "PUT"
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(400).json(result);
    }

    const booking = {
      id: bookings.length + 1,
      userId,
      slotId,
      startTime,
      endTime,
      status: "CONFIRMED"
    };

    bookings.push(booking);

    // Call Notification Service
    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SMS",
          message: `Đặt chỗ thành công! Ô đỗ: ID ${slotId}, từ ${startTime} đến ${endTime}.`
        })
      });
    } catch (err) {
      console.log("Error calling notification-service:", err.message);
    }

    res.json({
      message: "Đặt chỗ thành công",
      booking
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kết nối Parking Service" });
  }
});

app.get("/", (req, res) => {
  res.json(bookings);
});

app.put("/:id/cancel", async (req, res) => {
  const booking = bookings.find(b => b.id == req.params.id);

  if (!booking) {
    return res.status(404).json({ message: "Không tìm thấy booking" });
  }

  booking.status = "CANCELLED";

  await fetch(`${PARKING_SERVICE_URL}/slots/${booking.slotId}/release`, {
    method: "PUT"
  });

  // Call Notification Service
  try {
    await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SMS",
        message: `Đã hủy thành công lượt đặt chỗ ID: ${booking.id} cho ô đỗ ID ${booking.slotId}.`
      })
    });
  } catch (err) {
    console.log("Error calling notification-service:", err.message);
  }

  res.json({ message: "Hủy đặt chỗ thành công", booking });
});

app.post("/gate/entry", async (req, res) => {
  const { plateNumber } = req.body;

  if (!plateNumber) {
    return res.status(400).json({ message: "Thiếu biển số xe" });
  }

  try {
    // 1. Find user from Auth Service
    const authRes = await fetch(`${AUTH_SERVICE_URL}/users`);
    if (!authRes.ok) {
      return res.status(500).json({ message: "Lỗi kết nối Auth Service" });
    }
    const users = await authRes.json();
    const user = users.find(u => u.plateNumber === plateNumber);

    if (!user) {
      return res.status(404).json({ barrier: "CLOSED", message: "Không tìm thấy xe đăng ký trên hệ thống." });
    }

    // 2. Find active confirmed booking for this user
    const booking = bookings.find(b => b.userId == user.id && b.status === "CONFIRMED");

    if (!booking) {
      return res.status(400).json({ barrier: "CLOSED", message: `Không tìm thấy lịch đặt chỗ hoạt động cho người dùng ${user.name}.` });
    }

    // 3. Mark slot as OCCUPIED in Parking Service
    const parkRes = await fetch(`${PARKING_SERVICE_URL}/slots/${booking.slotId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "OCCUPIED" })
    });
    
    const parkData = await parkRes.json();
    const slotCode = parkData.slot ? parkData.slot.code : `Slot ${booking.slotId}`;

    // 4. Send notify
    try {
      await fetch(`${NOTIFICATION_SERVICE_URL}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "Email",
          message: `Xe biển số ${plateNumber} đã đi qua cổng Barrier. Đang đỗ tại ô ${slotCode}.`
        })
      });
    } catch(e) {}

    res.json({
      barrier: "OPEN",
      message: `Chào mừng ${user.name}! Barrier đã mở. Ô đỗ của bạn là: ${slotCode}.`
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi kết nối các service", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});
