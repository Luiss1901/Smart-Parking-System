const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVICES = [
  { name: 'auth-service', dir: 'auth-service', port: 3001, env: {} },
  { name: 'parking-service', dir: 'parking-service', port: 3002, env: {} },
  { name: 'booking-service', dir: 'booking-service', port: 3003, env: { PARKING_SERVICE_URL: 'http://localhost:3002' } },
  { name: 'payment-service', dir: 'payment-service', port: 3004, env: {} },
  { name: 'report-service', dir: 'report-service', port: 3005, env: { PARKING_SERVICE_URL: 'http://localhost:3002', PAYMENT_SERVICE_URL: 'http://localhost:3004' } }
];

console.log("=== SMART PARKING SYSTEM LOCAL RUNNER ===");

// 1. Install dependencies for each service if node_modules is missing
console.log("\n[1/3] Kiểm tra và cài đặt dependencies cho các microservice...");
SERVICES.forEach(service => {
  const servicePath = path.join(__dirname, service.dir);
  const nodeModulesPath = path.join(servicePath, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`-> Đang cài đặt dependencies cho ${service.name}...`);
    try {
      execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
      console.log(`✔ Cài đặt thành công cho ${service.name}.`);
    } catch (err) {
      console.error(`❌ Cài đặt thất bại cho ${service.name}: ${err.message}`);
      process.exit(1);
    }
  } else {
    console.log(`✔ ${service.name} đã cài đặt sẵn dependencies.`);
  }
});

// 2. Start all microservices
console.log("\n[2/3] Khởi chạy các Microservices...");
const processes = [];

SERVICES.forEach(service => {
  const servicePath = path.join(__dirname, service.dir);
  console.log(`-> Khởi chạy ${service.name} trên cổng ${service.port}...`);
  
  const child = spawn('node', ['index.js'], {
    cwd: servicePath,
    env: {
      ...process.env,
      PORT: service.port,
      ...service.env
    }
  });

  child.stdout.on('data', (data) => {
    console.log(`[${service.name}] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[${service.name} ERROR] ${data.toString().trim()}`);
  });

  child.on('close', (code) => {
    console.log(`[${service.name}] Đã dừng với mã thoát ${code}`);
  });

  processes.push(child);
});

// 3. Start simulated Nginx servers (API Gateway + Frontend)
console.log("\n[3/3] Khởi chạy Gateway và Frontend Server...");

// API Gateway (Port 8080)
const gateway = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  let targetPort;
  let targetPath = req.url;

  if (req.url.startsWith('/auth/')) {
    targetPort = 3001;
    targetPath = req.url.slice(5); // strip '/auth'
  } else if (req.url.startsWith('/parking/')) {
    targetPort = 3002;
    targetPath = req.url.slice(8); // strip '/parking'
  } else if (req.url.startsWith('/bookings/')) {
    targetPort = 3003;
    targetPath = req.url.slice(9); // strip '/bookings'
  } else if (req.url.startsWith('/payments/')) {
    targetPort = 3004;
    targetPath = req.url.slice(9); // strip '/payments'
  } else if (req.url.startsWith('/reports/')) {
    targetPort = 3005;
    targetPath = req.url.slice(8); // strip '/reports'
  }

  if (!targetPort) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Gateway: Đường dẫn không hợp lệ" }));
    return;
  }

  // Proxy request details
  const proxyReq = http.request({
    host: 'localhost',
    port: targetPort,
    path: targetPath,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: "Gateway Lỗi: Không thể kết nối dịch vụ", error: err.message }));
  });

  req.pipe(proxyReq);
});

gateway.listen(8080, () => {
  console.log("✔ [API Gateway] Đang chạy tại http://localhost:8080");
});

// Frontend Server (Port 5173)
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const frontendServer = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(__dirname, 'frontend', parsedUrl.pathname);
  if (parsedUrl.pathname === '/') {
    filePath = path.join(__dirname, 'frontend', 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Không Tìm Thấy File');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

frontendServer.listen(5173, () => {
  console.log("✔ [Frontend Web] Đang chạy tại http://localhost:5173");
  console.log("\n=========================================");
  console.log("HỆ THỐNG ĐÃ SẴN SÀNG HOẠT ĐỘNG KHÔNG CẦN DOCKER!");
  console.log("👉 Vui lòng mở trình duyệt và truy cập: http://localhost:5173");
  console.log("Nhấn Ctrl+C để dừng toàn bộ hệ thống.");
  console.log("=========================================\n");

  // Auto open browser (supports Windows, Mac, Linux)
  const openCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    spawn(openCmd, ['http://localhost:5173'], { shell: true });
  } catch(e) {}
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log("\nĐang tắt toàn bộ các Microservices...");
  processes.forEach(proc => proc.kill());
  gateway.close();
  frontendServer.close();
  console.log("Đã tắt hệ thống thành công!");
  process.exit();
});
