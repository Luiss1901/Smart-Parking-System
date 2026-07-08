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
  // Default amount to 40000 VND
  let amount = 40000;
  
  const modal = document.getElementById("payment-modal");
  const qrImage = document.getElementById("payment-qr-image");
  const amountVndEl = document.getElementById("payment-amount-vnd");
  const amountUsdEl = document.getElementById("payment-amount-usd");
  const paymentInfoEl = document.getElementById("payment-info");
  const confirmBtn = document.getElementById("btn-confirm-payment");

  try {
    addLog("gateway", "ROUTE /payments/pay", `Khởi tạo mã VietQR liên kết cho Booking ID ${bookingId}...`);
    
    // Generate VietQR dynamic link (MB Bank, Account: 123456789)
    const vietQrUrl = `https://img.vietqr.io/image/MB-123456789-compact.png?amount=${amount}&addInfo=Thanh%20toan%20Booking%20${bookingId}&accountName=SMART%20PARKING%20SYSTEM`;
    
    // Convert USD using external API live rate for visual confirmation
    let usdAmount = (amount / 25400).toFixed(2);
    try {
      const exchangeRes = await fetch("https://open.er-api.com/v6/latest/VND");
      if (exchangeRes.ok) {
        const rateData = await exchangeRes.json();
        usdAmount = (amount * rateData.rates.USD).toFixed(2);
      }
    } catch(e) {}

    // Update UI elements
    qrImage.src = vietQrUrl;
    amountVndEl.textContent = amount.toLocaleString() + "đ";
    amountUsdEl.textContent = `$${usdAmount} USD`;
    paymentInfoEl.textContent = `Booking-${bookingId}`;
    
    // Open payment modal
    modal.classList.add("show");

    // Handle payment confirmation click
    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = "<i class='lucide-icon' data-lucide='loader'></i> Đang xử lý...";
      
      try {
        addLog("gateway", "ROUTE /payments/pay", `Gửi yêu cầu thanh toán hóa đơn Booking ID ${bookingId} sang Payment Service...`);
        const res = await fetch(`${API}/payments/pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId, amount })
        });
        
        const data = await res.json();
        
        if (res.ok) {
          addLog("payment", "POST /pay", `Thanh toán VietQR hoàn tất! Mã GD: ${data.payment.id}, USD: $${data.payment.usdAmount}`);
          alert(`Thanh toán thành công ${amount.toLocaleString()}đ (~$${data.payment.usdAmount} USD)!`);
          closePaymentModal();
          loadBookings();
          loadReports();
          
          if (typeof loadNotifications === "function") {
            loadNotifications();
          }
        } else {
          alert(data.message);
          addLog("payment", "POST /pay", "Thất bại: " + data.message);
        }
      } catch (err) {
        addLog("payment", "ERROR", "Lỗi kết nối: " + err.message);
      } finally {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = "<i data-lucide='check'></i> Tôi Đã Chuyển Khoản Thành Công";
        
        // Re-init lucide icons on confirm button
        lucide.createIcons();
      }
    };
  } catch (err) {
    addLog("payment", "ERROR", "Lỗi tạo phiên thanh toán: " + err.message);
  }
}

function closePaymentModal() {
  const modal = document.getElementById("payment-modal");
  if (modal) modal.classList.remove("show");
}
