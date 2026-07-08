// Reports & Analytics
async function loadReports() {
  try {
    addLog("gateway", "ROUTE /reports/revenue", "Đang tải dữ liệu doanh thu từ Report Service...");
    const resRev = await fetch(`${API}/reports/revenue`);
    const dataRev = await resRev.json();
    
    if (resRev.ok) {
      document.getElementById("report-revenue").textContent = dataRev.totalRevenue.toLocaleString() + "đ";
      document.getElementById("report-payments").textContent = dataRev.totalPayments;
      addLog("report", "GET /revenue", `Doanh thu tổng hợp: ${dataRev.totalRevenue}đ qua ${dataRev.totalPayments} thanh toán.`);
    }
  } catch (err) {
    addLog("report", "ERROR", "Lỗi kết nối dữ liệu doanh thu: " + err.message);
  }

  try {
    addLog("gateway", "ROUTE /reports/usage", "Đang tải dữ liệu tỷ lệ sử dụng từ Report Service...");
    const resUsage = await fetch(`${API}/reports/usage`);
    const dataUsage = await resUsage.json();
    
    if (resUsage.ok) {
      const occupied = dataUsage.occupiedSlots;
      const total = dataUsage.totalSlots;
      const ratePercent = parseInt(dataUsage.usageRate) || 0;
      
      document.getElementById("usage-percent").textContent = dataUsage.usageRate;
      document.getElementById("usage-detail").textContent = `Đang đỗ: ${occupied} / Tổng số: ${total} ô`;
      
      // Animate Circular Gauge SVG
      const circle = document.getElementById("usage-circle");
      if (circle) {
        const radius = circle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (ratePercent / 100) * circumference;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
      }
      
      addLog("report", "GET /usage", `Tỷ lệ sử dụng hiện tại: ${dataUsage.usageRate} (Đỗ ${occupied}/${total} ô)`);
    }
  } catch (err) {
    addLog("report", "ERROR", "Lỗi kết nối dữ liệu sử dụng: " + err.message);
  }
}
