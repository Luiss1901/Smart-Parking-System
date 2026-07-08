const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

let slots = [
  { id: 1, code: "A01", status: "AVAILABLE" },
  { id: 2, code: "A02", status: "AVAILABLE" },
  { id: 3, code: "A03", status: "OCCUPIED" },
  { id: 4, code: "B01", status: "AVAILABLE" }
];

app.get("/slots", (req, res) => {
  res.json(slots);
});

app.get("/slots/available", (req, res) => {
  res.json(slots.filter(s => s.status === "AVAILABLE"));
});

app.put("/slots/:id/reserve", (req, res) => {
  const slot = slots.find(s => s.id == req.params.id);

  if (!slot) {
    return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });
  }

  if (slot.status !== "AVAILABLE") {
    return res.status(400).json({ message: "Chỗ đỗ không còn trống" });
  }

  slot.status = "RESERVED";
  res.json({ message: "Đã giữ chỗ", slot });
});

app.put("/slots/:id/release", (req, res) => {
  const slot = slots.find(s => s.id == req.params.id);

  if (!slot) {
    return res.status(404).json({ message: "Không tìm thấy chỗ đỗ" });
  }

  slot.status = "AVAILABLE";
  res.json({ message: "Đã trả chỗ", slot });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Parking Service running on port ${PORT}`);
});
