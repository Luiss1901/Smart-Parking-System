const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "payment-service" }));

app.use(cors());
app.use(express.json());

app.use('/', paymentRoutes);

app.use(errorHandler);

module.exports = app;
