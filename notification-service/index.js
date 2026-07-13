require('dotenv').config();
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "notification-service" }));

app.use(cors());
app.use(express.json());

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD
  }
});

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                type TEXT,
                "to" TEXT,
                subject TEXT,
                message TEXT,
                "sentAt" TEXT
            )
        `);
        console.log("Notification DB initialized successfully");
    } catch (err) {
        console.error("Notification DB Init Error", err);
    }
};
setTimeout(initDb, 5000);

app.post("/send-email", async (req, res) => {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: "Thiếu thông tin người nhận, tiêu đề hoặc nội dung email" });
  }

  if (EMAIL_USER && EMAIL_APP_PASSWORD) {
    try {
      await transporter.sendMail({
        from: `"Smart Parking System" <${EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
      });
      console.log(`[Notification Service] Successfully sent real email to ${to}`);
    } catch (err) {
      console.log(`[Notification Service] Failed to send real email to ${to}:`, err.message);
    }
  } else {
    console.log(`[Notification Service] EMAIL_USER or EMAIL_APP_PASSWORD missing. Email skipped. Only logged locally.`);
  }

  let notification = null;
  try {
      const insertRes = await poolPrimary.query(
          'INSERT INTO notifications (type, "to", subject, message, "sentAt") VALUES ($1, $2, $3, $4, $5) RETURNING *',
          ['Email', to, subject, "HTML Content", new Date().toISOString()]
      );
      notification = insertRes.rows[0];
  } catch (err) {
      console.error("DB Insert Error", err.message);
  }

  res.json({
    message: "Gửi thông báo thành công",
    notification
  });
});

app.post("/notify", async (req, res) => {
  const { type, to, subject, message } = req.body;

  if (!to || !subject || !message) {
    return res.status(400).json({ message: "Thiếu thông tin người nhận, tiêu đề hoặc nội dung email" });
  }

  if (EMAIL_USER && EMAIL_APP_PASSWORD && (!type || type === 'Email')) {
    try {
      await transporter.sendMail({
        from: `"Smart Parking System" <${EMAIL_USER}>`,
        to: to,
        subject: subject,
        text: message
      });
      console.log(`[Notification Service] Successfully sent real email to ${to}`);
    } catch (err) {
      console.log(`[Notification Service] Failed to send real email to ${to}:`, err.message);
    }
  } else {
    console.log(`[Notification Service] EMAIL_USER or EMAIL_APP_PASSWORD missing. Email skipped. Only logged locally.`);
  }

  let notification = null;
  try {
      const insertRes = await poolPrimary.query(
          'INSERT INTO notifications (type, "to", subject, message, "sentAt") VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [type || "Email", to, subject, message, new Date().toISOString()]
      );
      notification = insertRes.rows[0];
  } catch (err) {
      console.error("DB Insert Error", err.message);
  }

  res.json({
    message: "Gửi thông báo thành công",
    notification
  });
});

app.get("/", async (req, res) => {
  try {
      const result = await poolReplica.query("SELECT * FROM notifications ORDER BY id DESC");
      res.json(result.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
  if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
    console.log("WARNING: EMAIL_USER or EMAIL_APP_PASSWORD is missing. Real emails will NOT be sent.");
  }
});
