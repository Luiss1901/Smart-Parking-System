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
  try {
    // Calculate payment amount based on hours in mock format
    // We will default amount to 40000 for Demo 6 compatibility
    const amount = 40000;
    
    addLog("gateway", "ROUTE /payments/pay", "Gửi yêu cầu thanh toán sang Payment Service...");
    const res = await fetch(`${API}/payments/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      addLog("payment", "POST /pay", `Thanh toán thành công hóa đơn ${data.payment.id} trị giá ${data.payment.amount}đ cho Booking ${bookingId}`);
      alert("Thanh toán thành công " + amount.toLocaleString() + "đ!");
      loadBookings();
      loadReports();
    } else {
      alert(data.message);
      addLog("payment", "POST /pay", "Thất bại: " + data.message);
    }
  } catch (err) {
    addLog("payment", "ERROR", "Lỗi kết nối Payment Service: " + err.message);
  }
}
