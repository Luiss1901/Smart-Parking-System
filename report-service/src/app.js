const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "report-service" }));

app.use(cors());
app.use(express.json());

app.use('/', reportRoutes);

app.use(errorHandler);

module.exports = app;
