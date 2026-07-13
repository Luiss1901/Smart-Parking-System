const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "booking-service" }));

app.use(cors());
app.use(express.json());

app.use('/', bookingRoutes);

app.use(errorHandler);

module.exports = app;
