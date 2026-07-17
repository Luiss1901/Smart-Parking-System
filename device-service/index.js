const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Pool } = require("pg");
const net = require("net");
const rabbitmq = require('./utils/rabbitmq');

const app = express();
app.get("/health", (req, res) => res.status(200).json({ status: "OK", service: "device-service" }));

app.use(cors());
app.use(express.json());

const PARKING_SERVICE_URL = process.env.PARKING_SERVICE_URL || "http://parking-service:3000";

const poolPrimary = new Pool({ connectionString: process.env.POSTGRES_PRIMARY_URL });
const poolReplica = new Pool({ connectionString: process.env.POSTGRES_REPLICA_URL });

const initDb = async () => {
    try {
        await poolPrimary.query(`
            CREATE TABLE IF NOT EXISTS device_logs (
                id SERIAL PRIMARY KEY,
                device TEXT,
                action TEXT,
                timestamp TEXT,
                details TEXT
            )
        `);
        console.log("Device DB initialized successfully");
    } catch (err) {
        console.error("Device DB Init Error", err);
    }
};
setTimeout(initDb, 5000);

function logEvent(device, action, details) {
  try {
      poolPrimary.query(
          'INSERT INTO device_logs (device, action, timestamp, details) VALUES ($1, $2, $3, $4)',
          [device, action, new Date().toISOString(), details]
      );
  } catch(e) {
      console.log("Error logging event", e);
  }
}

// HTTP API
app.post("/simulate/camera", async (req, res) => {
  const { slotId, action, plateNumber } = req.body;
  if (!slotId || !action) {
    return res.status(400).json({ message: "Thiếu slotId hoặc action (ENTER/EXIT)" });
  }

  const generatedPlate = plateNumber || `30A-${Math.floor(10000 + Math.random() * 90000)}`;
  const status = action === 'ENTER' ? 'OCCUPIED' : 'AVAILABLE';
  
  try {
    // Keep HTTP call if needed, but the plan said "Bỏ gọi REST sang parking-service"
    // Wait, the plan: "Xóa bỏ axios.put(PARKING_SERVICE_URL...) trong /simulate/camera. Thêm rabbitmq.publishEvent..."
    
    // Publish event to RabbitMQ
    await rabbitmq.publishEvent('device.plate-detected', { slotId, action, plateNumber: generatedPlate, status });

    const details = `Xe ${action === 'ENTER' ? 'vào' : 'ra'} ô đỗ ID ${slotId}. Biển số: ${generatedPlate}`;
    logEvent('CAMERA_ALPR', action, details);
    res.json({ message: "Đã giả lập camera thành công", plateNumber: generatedPlate, status });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Lỗi nội bộ server" });
  }
});

app.post("/simulate/barrier/:action", (req, res) => {
  const { action } = req.params; 
  if (action !== 'open' && action !== 'close') {
    return res.status(400).json({ message: "Action phải là open hoặc close" });
  }
  
  const details = `Điều khiển barrier: ${action.toUpperCase()}`;
  logEvent('BARRIER_GATE', action.toUpperCase(), details);
  res.json({ message: "Đã điều khiển barrier", action });
});

app.get("/logs", async (req, res) => {
  try {
      const logs = await poolReplica.query("SELECT * FROM device_logs ORDER BY id DESC LIMIT 100");
      res.json(logs.rows);
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// START TCP SERVER (BARRIER MOCK)
const tcpServer = net.createServer((socket) => {
  console.log("Barrier Controller connected via TCP");
  logEvent('TCP_SERVER', 'CONNECT', 'Barrier Controller Connected');
  
  socket.on("data", (data) => {
    const cmd = data.toString().trim();
    console.log("Received TCP command:", cmd);
    if (cmd === "OPEN") {
      logEvent('BARRIER_GATE', 'OPEN', 'Nhận lệnh OPEN qua TCP');
      socket.write("BARRIER_OPENED\n");
    } else if (cmd === "CLOSE") {
      logEvent('BARRIER_GATE', 'CLOSE', 'Nhận lệnh CLOSE qua TCP');
      socket.write("BARRIER_CLOSED\n");
    }
  });

  socket.on("end", () => {
    console.log("Barrier Controller disconnected");
  });
});
tcpServer.listen(9000, () => {
  console.log("TCP Server (Barrier Mock) listening on port 9000");
});

// START RTSP MOCK (IP CAMERA MOCK)
const rtspMockServer = net.createServer((socket) => {
  console.log("RTSP Client Connected to IP Camera Mock");
  logEvent('RTSP_SERVER', 'CONNECT', 'RTSP Video Stream Request Received');
  socket.write("RTSP/1.0 200 OK\r\nCSeq: 1\r\n\r\n");
  // Close immediately after acknowledging since it's just a mock
  socket.end(); 
});
rtspMockServer.listen(554, () => {
  console.log("RTSP Mock Server (IP Camera) listening on port 554");
});

// START HTTP SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Device Service HTTP running on port ${PORT}`);
});
