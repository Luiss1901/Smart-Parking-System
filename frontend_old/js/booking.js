let cachedBookings = [];

// Booking actions
async function submitBooking(e) {
  e.preventDefault();
  const slotId = parseInt(document.getElementById("modal-slot-id").value);
  const hours = parseInt(document.getElementById("booking-hours").value);
  const vehicleType = document.querySelector('input[name="vehicleType"]:checked').value;
  
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + hours * 60 * 60 * 1000);

  try {
    addLog("gateway", "ROUTE /bookings/", "Gửi yêu cầu tạo đặt chỗ sang Booking Service...");
    
    const res = await fetch(`${API}/bookings/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: currentUser.id,
        slotId: slotId,
        startTime: startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime: endTime.toISOString().slice(0, 19).replace('T', ' ')
      })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      addLog("booking", "POST /", `Tạo booking thành công. ID: ${data.booking.id}. Trạng thái slot đã đổi thành RESERVED.`);
      addLog("parking", "PUT /slots/:id/reserve", `Booking Service tự động gọi API cập nhật slot ${slotId}`);
      closeBookingModal();
      loadSlots();
      loadBookings();
      loadReports();
    } else {
      alert(data.message);
      addLog("booking", "POST /", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("booking", "ERROR", "Lỗi kết nối Booking Service: " + err.message);
  }
}

async function loadBookings() {
  const container = document.getElementById("bookings-container");
  if (!currentUser) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
        Vui lòng đăng nhập để xem thông tin đặt chỗ.
      </div>
    `;
    return;
  }

  try {
    addLog("gateway", "ROUTE /bookings/", "Yêu cầu danh sách đặt chỗ từ Booking Service...");
    const res = await fetch(`${API}/bookings/`);
    const bookings = await res.json();
    
    if (res.ok) {
      // Filter bookings for current logged-in user
      cachedBookings = bookings.filter(b => b.userId == currentUser.id);
      renderBookings(cachedBookings);
      addLog("booking", "GET /", `Tìm thấy ${cachedBookings.length} booking của người dùng.`);
    }
  } catch (err) {
    addLog("booking", "ERROR", "Lỗi kết nối Booking Service: " + err.message);
    container.innerHTML = `
      <div style="text-align: center; color: var(--danger); padding: 1.5rem 0;">
        Không thể tải dữ liệu đặt chỗ.
      </div>
    `;
  }
}

async function renderBookings(bookings) {
  const container = document.getElementById("bookings-container");
  if (bookings.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 1.5rem 0;">
        Bạn chưa có lượt đặt chỗ nào hoạt động.
      </div>
    `;
    return;
  }

  container.innerHTML = "";
  
  // Get all payments to see which bookings are paid
  let payments = [];
  try {
    const resPay = await fetch(`${API}/payments/`);
    if (resPay.ok) payments = await resPay.json();
  } catch(e) {}

  bookings.forEach(booking => {
    const item = document.createElement("div");
    item.className = "booking-list-item";
    
    const slot = cachedSlots.find(s => s.id == booking.slotId) || { code: "N/A" };
    const isPaid = payments.some(p => p.bookingId == booking.id);
    
    let statusBadge = `<span class="badge-status badge-reserved">Chưa Thanh Toán</span>`;
    let payButton = "";
    let cancelButton = "";

    if (booking.status === "CANCELLED") {
      statusBadge = `<span class="badge-status badge-occupied" style="background: rgba(148, 163, 184, 0.1); color: var(--text-muted)">Đã Hủy</span>`;
    } else if (isPaid) {
      statusBadge = `<span class="badge-status badge-available">Đã Thanh Toán</span>`;
    } else {
      // If not paid and not cancelled
      payButton = `<button onclick="payBooking(${booking.id})" class="btn" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem; background: var(--success); box-shadow: 0 4px 10px var(--success-glow);">Thanh Toán</button>`;
      cancelButton = `<button onclick="cancelBooking(${booking.id})" class="btn btn-secondary" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">Hủy</button>`;
    }

    item.innerHTML = `
      <div class="booking-info">
        <h4>Đặt chỗ ô: ${slot.code} (ID: ${booking.id})</h4>
        <p>Bắt đầu: ${booking.startTime.slice(11, 16)} | Kết thúc: ${booking.endTime.slice(11, 16)}</p>
        <p style="margin-top: 0.25rem;">Trạng thái: ${statusBadge}</p>
      </div>
      <div class="booking-actions">
        ${payButton}
        ${cancelButton}
      </div>
    `;
    
    container.appendChild(item);
  });
}

async function cancelBooking(bookingId) {
  if (!confirm("Bạn có chắc chắn muốn hủy đặt chỗ này?")) return;

  try {
    addLog("gateway", "ROUTE /bookings/:id/cancel", "Yêu cầu hủy đặt chỗ gửi đến Booking Service...");
    const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
      method: "PUT"
    });
    const data = await res.json();
    
    if (res.ok) {
      addLog("booking", "PUT /:id/cancel", `Hủy booking ${bookingId} thành công. Giải phóng ô đỗ.`);
      addLog("parking", "PUT /slots/:id/release", `Booking Service tự động gọi API giải phóng slot đỗ.`);
      alert("Đã hủy đặt chỗ thành công!");
      loadSlots();
      loadBookings();
      loadReports();
    } else {
      alert(data.message);
      addLog("booking", "PUT /:id/cancel", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("booking", "ERROR", "Lỗi kết nối Booking Service: " + err.message);
  }
}
