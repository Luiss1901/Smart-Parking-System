// Hardware simulator operations
async function simulateGateEntry() {
  const plateNumber = document.getElementById("sim-plate-input").value.trim();
  const messageEl = document.getElementById("sim-gate-message");
  const barrierArm = document.getElementById("sim-barrier-arm");
  const barrierStatus = document.getElementById("sim-barrier-status");

  if (!plateNumber) {
    alert("Vui lòng nhập biển số xe.");
    return;
  }

  try {
    addLog("gateway", "ROUTE /bookings/gate/entry", `Định tuyến yêu cầu quét biển số ${plateNumber}...`);
    messageEl.textContent = "Đang quét biển số xe...";
    messageEl.style.color = "var(--text-muted)";

    const res = await fetch(`${API}/bookings/gate/entry`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plateNumber })
    });

    const data = await res.json();

    if (res.ok && data.barrier === "OPEN") {
      addLog("booking", "POST /gate/entry", `KẾT QUẢ: ${data.message} -> MỞ CỔNG`);
      
      // Open Barrier visually
      barrierArm.classList.add("open");
      barrierStatus.textContent = "CỔNG MỞ";
      barrierStatus.classList.add("open");
      messageEl.textContent = data.message;
      messageEl.style.color = "var(--success)";

      // Refresh layout data
      loadSlots();
      loadSensors();
      loadBookings();
      loadNotifications();

      // Automatically close barrier after 5 seconds
      setTimeout(() => {
        barrierArm.classList.remove("open");
        barrierStatus.textContent = "CỔNG ĐÓNG";
        barrierStatus.classList.remove("open");
        addLog("booking", "SYSTEM", "Barrier tự động đóng lại sau khi xe qua.");
      }, 5000);
    } else {
      addLog("booking", "POST /gate/entry", `THẤT BẠI: ${data.message || "Từ chối xe"}`);
      barrierArm.classList.remove("open");
      barrierStatus.textContent = "CỔNG ĐÓNG";
      barrierStatus.classList.remove("open");
      messageEl.textContent = data.message || "Lỗi không xác định";
      messageEl.style.color = "var(--danger)";
    }
  } catch (err) {
    addLog("booking", "ERROR", "Lỗi quét biển số: " + err.message);
    messageEl.textContent = "Lỗi kết nối cổng Barrier: " + err.message;
    messageEl.style.color = "var(--danger)";
  }
}

async function loadSensors() {
  const container = document.getElementById("sensor-override-container");
  if (!container) return;

  try {
    const res = await fetch(`${API}/parking/slots`);
    const slots = await res.json();

    if (!res.ok) throw new Error("Lỗi fetch slots");

    let html = "";
    slots.forEach(slot => {
      html += `
        <div class="sensor-list-item">
          <span class="sensor-slot-name"><i data-lucide="cpu" style="width:14px;height:14px;vertical-align:middle;margin-right:0.25rem;"></i> Vị trí ${slot.code}</span>
          <select class="sensor-select" onchange="changeSensorStatus(${slot.id}, this.value)">
            <option value="AVAILABLE" ${slot.status === 'AVAILABLE' ? 'selected' : ''}>Trống (AVAILABLE)</option>
            <option value="RESERVED" ${slot.status === 'RESERVED' ? 'selected' : ''}>Đã đặt (RESERVED)</option>
            <option value="OCCUPIED" ${slot.status === 'OCCUPIED' ? 'selected' : ''}>Có xe (OCCUPIED)</option>
          </select>
        </div>
      `;
    });

    container.innerHTML = html;
    
    // Create icons for CPU in dynamically added HTML
    lucide.createIcons({
      attrs: {
        class: 'lucide-icon'
      }
    });
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger)">Không thể nạp cảm biến: ${err.message}</div>`;
  }
}

async function changeSensorStatus(slotId, status) {
  try {
    addLog("gateway", `ROUTE /parking/slots/${slotId}/status`, `Định tuyến cảm biến cập nhật trạng thái ô đỗ thành ${status}...`);
    
    const res = await fetch(`${API}/parking/slots/${slotId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json();
    if (res.ok) {
      addLog("parking", "PUT /slots/:id/status", `Cảm biến ô đỗ ID ${slotId} báo trạng thái mới: ${status}`);
      loadSlots();
      loadReports();
    } else {
      alert("Lỗi: " + data.message);
    }
  } catch (err) {
    addLog("parking", "ERROR", "Lỗi gửi lệnh cảm biến: " + err.message);
  }
}

async function loadNotifications() {
  const container = document.getElementById("inbox-container");
  if (!container) return;

  try {
    addLog("gateway", "ROUTE /notifications/", "Đang tải hộp thư thông báo...");
    const res = await fetch(`${API}/notifications/`);
    const notifications = await res.json();

    if (res.ok) {
      addLog("report", "GET /notifications/", `Hộp thư nhận được ${notifications.length} tin nhắn.`);
      if (notifications.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Chưa có thông báo nào được gửi.</div>`;
        return;
      }

      // Sort newest first
      notifications.reverse();

      let html = "";
      notifications.forEach(n => {
        const dateStr = new Date(n.sentAt).toLocaleTimeString();
        const badgeClass = n.type.toLowerCase() === "sms" ? "sms" : "email";
        html += `
          <div class="inbox-item">
            <div class="inbox-item-header">
              <span class="inbox-badge ${badgeClass}">${n.type}</span>
              <span style="color:var(--text-muted)">${dateStr}</span>
            </div>
            <div class="inbox-message">${n.message}</div>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      container.innerHTML = `<div style="color:var(--danger)">Lỗi nạp tin nhắn từ Notification Service.</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Không thể kết nối Notification Service: ${err.message}</div>`;
  }
}
