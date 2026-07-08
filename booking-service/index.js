const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let bookings = [];

app.post("/", async (req, res) => {
  const { userId, slotId, startTime, endTime } = req.body;

  if (!userId || !slotId || !startTime || !endTime) {
    return res.status(400).json({ message: "Thiếu thông tin đặt chỗ" });
  }

  try {
    const response = await fetch(`http://parking-service:3000/slots/${slotId}/reserve`, {
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

  await fetch(`http://parking-service:3000/slots/${booking.slotId}/release`, {
    method: "PUT"
  });

  res.json({ message: "Hủy đặt chỗ thành công", booking });
});

app.listen(3000, () => {
  console.log("Booking Service running on port 3000");
});
