// Configuration
const API = window.location.port === "5173" || window.location.hostname === "localhost" 
  ? "http://localhost:8080" 
  : window.location.origin;

// Logger module
function addLog(service, endpoint, message) {
  const logsContainer = document.getElementById("event-logs");
  if (!logsContainer) return;

  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  
  const line = document.createElement("div");
  line.className = "log-line";
  
  let tagClass = "tag-info";
  if (service === "gateway") tagClass = "tag-gateway";
  else if (service === "auth") tagClass = "tag-auth";
  else if (service === "parking") tagClass = "tag-parking";
  else if (service === "booking") tagClass = "tag-booking";
  else if (service === "payment") tagClass = "tag-payment";
  else if (service === "report") tagClass = "tag-report";

  line.innerHTML = `
    <span class="log-time">[${timeStr}]</span>
    <span class="log-tag ${tagClass}">${service.toUpperCase()}</span>
    <span class="log-message"><b>${endpoint}</b>: ${message}</span>
  `;
  
  logsContainer.appendChild(line);
  logsContainer.scrollTop = logsContainer.scrollHeight;
}

function clearLogs() {
  document.getElementById("event-logs").innerHTML = "";
  addLog("gateway", "SYSTEM", "Đã xoá lịch sử logs.");
}
