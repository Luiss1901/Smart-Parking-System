const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/revenue", async (req, res) => {
  let totalRevenue = 500000;
  let totalPayments = 25;

  try {
    const response = await fetch("http://payment-service:3000/");
    if (response.ok) {
      const payments = await response.json();
      payments.forEach(p => {
        totalRevenue += p.amount;
        totalPayments += 1;
      });
    }
  } catch (error) {
    console.log("Error fetching from payment-service, using default mock data", error.message);
  }

  res.json({
    date: new Date().toISOString().slice(0, 10),
    totalRevenue,
    totalPayments
  });
});

app.get("/usage", async (req, res) => {
  let totalSlots = 100;
  let occupiedSlots = 65;
  let availableSlots = 35;

  try {
    const response = await fetch("http://parking-service:3000/slots");
    if (response.ok) {
      const slots = await response.json();
      totalSlots = slots.length;
      occupiedSlots = slots.filter(s => s.status === "OCCUPIED" || s.status === "RESERVED").length;
      availableSlots = slots.filter(s => s.status === "AVAILABLE").length;
    }
  } catch (error) {
    console.log("Error fetching from parking-service, using default mock data", error.message);
  }

  const usageRate = totalSlots > 0 ? `${Math.round((occupiedSlots / totalSlots) * 100)}%` : "0%";

  res.json({
    totalSlots,
    occupiedSlots,
    availableSlots,
    usageRate
  });
});

app.listen(3000, () => {
  console.log("Report Service running on port 3000");
});
