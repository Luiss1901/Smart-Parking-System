// Payment actions
async function updateEstimatedCost() {
  const hours = parseInt(document.getElementById("booking-hours").value) || 1;
  const vehicleType = document.querySelector('input[name="vehicleType"]:checked').value;
  
  document.getElementById("price-unit-desc").textContent = 
    vehicleType === "CAR" ? "Ô tô: 20,000đ/giờ" : "Xe máy: 5,000đ/giờ";

  try {
    addLog("gateway", "ROUTE /payments/calculate", "Đang gọi Payment Service tính phí...");
    const res = await fetch(`${API}/payments/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours, vehicleType })
    });
    const data = await res.json();
    if (res.ok) {
      document.getElementById("estimated-cost").textContent = data.total.toLocaleString() + "đ";
      addLog("payment", "POST /calculate", `Chi phí tính toán cho ${hours} giờ (${vehicleType}): ${data.total}đ`);
    }
  } catch (err) {
    // Fallback calculation on client side if payment service is down
    const price = vehicleType === "CAR" ? 20000 : 5000;
    const total = hours * price;
    document.getElementById("estimated-cost").textContent = total.toLocaleString() + "đ (Offline)";
    addLog("payment", "LOCAL_FALLBACK", `Lỗi kết nối Payment Service, tự tính toán: ${total}đ`);
  }
}

async function payBooking(bookingId) {
  let amount = 40000;
  try {
    addLog("gateway", "ROUTE /payments/vnpay_url", `Yêu cầu tạo liên kết VNPay Sandbox cho Booking ID ${bookingId}...`);
    const res = await fetch(`${API}/payments/vnpay_url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount })
    });
    const data = await res.json();
    if (res.ok && data.paymentUrl) {
      addLog("payment", "VNPAY", "Chuyển hướng sang VNPay Sandbox: " + data.paymentUrl);
      
      // Open VNPay Sandbox checkout in new window/tab
      window.open(data.paymentUrl, '_blank');
      
      alert("Đang mở cổng thanh toán VNPay Sandbox ở tab mới.\nHướng dẫn test:\n1. Chọn Ngân hàng NCB\n2. Nhập Số thẻ: 9704198526191432119\n3. Tên: NGUYEN VAN A\n4. Ngày phát hành: 07/15\n5. OTP: 123456");
    } else {
      alert("Không thể khởi tạo URL VNPay: " + data.message);
    }
  } catch (err) {
    addLog("payment", "ERROR", "Lỗi khởi tạo cổng VNPay: " + err.message);
  }
}

async function processVnpaySuccess(bookingId, amount) {
  try {
    addLog("gateway", "ROUTE /payments/pay", `Nhận được callback từ VNPay cho Booking ID ${bookingId}. Đang ghi nhận giao dịch...`);
    const res = await fetch(`${API}/payments/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      addLog("payment", "VNPAY_CALLBACK", `Thành công! ID giao dịch VNPay: ${data.payment.id}, quy đổi USD live: $${data.payment.usdAmount}`);
      alert(`Thanh toán VNPay thành công ${amount.toLocaleString()}đ (~$${data.payment.usdAmount} USD)!\nLượt đặt chỗ đã được xác thực thanh toán.`);
      loadBookings();
      loadReports();
      
      if (typeof loadNotifications === "function") {
        loadNotifications();
      }
    } else {
      addLog("payment", "ERROR", "Lỗi lưu giao dịch VNPay: " + data.message);
    }
  } catch (err) {
    addLog("payment", "ERROR", "Lỗi kết nối lưu giao dịch VNPay: " + err.message);
  }
}

function closePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.classList.remove("show");
}

async function loadPaymentHistory() {
  const tbody = document.getElementById("payment-history-rows");
  if (!tbody) return;

  try {
    addLog("gateway", "ROUTE /payments/", "Đang tải danh sách lịch sử giao dịch thanh toán...");
    const res = await fetch(`${API}/payments/`);
    const payments = await res.json();

    if (res.ok) {
      if (payments.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">
              Chưa có giao dịch nào được thực hiện.
            </td>
          </tr>
        `;
        return;
      }

      // Sort by newest first
      payments.reverse();

      let html = "";
      payments.forEach(p => {
        const dateStr = new Date(p.paidAt).toLocaleString();
        html += `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.02);">
            <td style="padding: 0.85rem 1rem; color: white; font-weight: 500;">#${p.id}</td>
            <td style="padding: 0.85rem 1rem; color: var(--text-muted);">Booking #${p.bookingId}</td>
            <td style="padding: 0.85rem 1rem; color: white;">${p.amount.toLocaleString()}đ</td>
            <td style="padding: 0.85rem 1rem; color: var(--success); font-weight: 500;">$${p.usdAmount} USD</td>
            <td style="padding: 0.85rem 1rem; color: var(--text-muted); font-size: 0.8rem;">${dateStr}</td>
            <td style="padding: 0.85rem 1rem;">
              <span class="badge-status" style="background: rgba(16,185,129,0.08); color: var(--success); padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem;">${p.status}</span>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">
            Lỗi nạp lịch sử giao dịch: ${payments.message || 'Lỗi server'}
          </td>
        </tr>
      `;
    }
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--danger); padding: 2rem;">
          Không thể kết nối Payment Service: ${err.message}
        </td>
      </tr>
    `;
  }
}
