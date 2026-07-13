let cachedSlots = [];

// Parking slot actions
async function loadSlots() {
  try {
    addLog("gateway", "ROUTE /parking/slots", "Đang tải danh sách chỗ đỗ từ Parking Service...");
    const res = await fetch(`${API}/parking/slots`);
    const slots = await res.json();
    
    if (res.ok) {
      cachedSlots = slots;
      renderSlots(slots);
      addLog("parking", "GET /slots", `Đã tải ${slots.length} chỗ đỗ thành công.`);
    }
  } catch (err) {
    addLog("parking", "ERROR", "Không thể kết nối Parking Service: " + err.message);
    document.getElementById("slots-grid").innerHTML = `
      <div style="grid-column: span 2; text-align: center; color: var(--danger); padding: 1rem;">
        Không thể tải dữ liệu bãi đỗ xe. Hãy đảm bảo Docker Compose đang chạy.
      </div>
    `;
  }
}

function renderSlots(slots) {
  const grid = document.getElementById("slots-grid");
  grid.innerHTML = "";
  
  slots.forEach(slot => {
    const card = document.createElement("div");
    const statusClass = slot.status.toLowerCase();
    card.className = `parking-slot-card ${statusClass}`;
    
    let statusBadge = "";
    let statusLabel = "";

    if (slot.status === "AVAILABLE") {
      statusBadge = "badge-available";
      statusLabel = "Trống";
      card.onclick = () => openBookingModal(slot.id, slot.code);
    } else if (slot.status === "OCCUPIED") {
      statusBadge = "badge-occupied";
      statusLabel = "Có xe";
    } else if (slot.status === "RESERVED") {
      statusBadge = "badge-reserved";
      statusLabel = "Đã giữ chỗ";
    }

    card.innerHTML = `
      <div class="slot-header">
        <span class="slot-code">${slot.code}</span>
        <span class="slot-badge ${statusBadge}">${statusLabel}</span>
      </div>
      <div class="slot-body">
        <span>Slot ID: ${slot.id}</span>
        <div class="slot-icon">
          <i data-lucide="car"></i>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
  });
  
  lucide.createIcons();
}

// Modal Control & Cost Calculation
function openBookingModal(id, code) {
  if (!currentUser) {
    alert("Vui lòng đăng nhập để đặt chỗ!");
    addLog("gateway", "BLOCKED", "Yêu cầu đặt chỗ bị chặn: Chưa đăng nhập");
    return;
  }
  document.getElementById("modal-slot-id").value = id;
  document.getElementById("modal-slot-code").textContent = code;
  document.getElementById("booking-hours").value = 2;
  
  document.getElementById("booking-modal").classList.add("show");
  updateEstimatedCost();
}

function closeBookingModal() {
  document.getElementById("booking-modal").classList.remove("show");
}
