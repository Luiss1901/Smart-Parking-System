# Smart Parking System (Hệ thống Bãi đỗ xe thông minh)

Dự án này là một hệ thống quản lý bãi đỗ xe thông minh được xây dựng theo kiến trúc **Microservices**, sử dụng **Nginx làm API Gateway**, triển khai qua **Docker Compose** và có giao diện **Frontend Dashboard** hiện đại phong cách Glassmorphism.

---

## 1. Kiến trúc Hệ thống (C4 Model)
Kiến trúc chi tiết (Level 1 đến Level 4) được mô tả bằng PlantUML trong file báo cáo, gồm các phần chính:
* **API Gateway**: Điểm tiếp nhận request từ Client (Port `8080`), định tuyến tới các service thích hợp.
* **Auth Service**: Đăng ký, đăng nhập và quản lý thông tin tài khoản người dùng (Port `3001`).
* **Parking Service**: Quản lý trạng thái các ô đỗ xe (Trống, Đã đặt, Có xe) (Port `3002`).
* **Booking Service**: Thực hiện quy trình đặt chỗ, giữ chỗ và giải phóng ô đỗ xe (Port `3003`).
* **Payment Service**: Tính toán chi phí và xử lý thanh toán hóa đơn đỗ xe (Port `3004`).
* **Report Service**: Tổng hợp dữ liệu doanh thu và tỷ lệ lấp đầy bãi xe (Port `3005`).
* **Frontend Web App**: Giao diện người dùng tương tác trực tiếp (Port `5173`).

---

## 2. Cách Chạy Hệ thống

### Yêu cầu hệ thống:
* Đã cài đặt **Docker Desktop** (hoặc Docker Engine & Docker Compose).

### Các bước chạy:
1. Mở terminal tại thư mục chứa dự án:
   ```bash
   cd smart-parking-system
   ```
2. Khởi chạy hệ thống bằng Docker Compose:
   ```bash
   docker compose up --build
   ```
3. Truy cập vào giao diện Web trên trình duyệt:
   ```text
   http://localhost:5173
   ```
4. Kiểm tra các dịch vụ hoạt động thông qua cổng API Gateway:
   - Auth Service: `http://localhost:8080/auth/users`
   - Parking Service: `http://localhost:8080/parking/slots`
   - Booking Service: `http://localhost:8080/bookings/`
   - Payment Service: `http://localhost:8080/payments/`
   - Report Service: `http://localhost:8080/reports/revenue`

---

## 3. Nhật Ký Đóng Góp Nhóm (Git Commit History)
Dự án được phân công công việc rõ ràng và được commit trực tiếp bởi 5 thành viên của nhóm trên Git:
* **Thành viên 1**: Đảm nhiệm Auth Service (Nhánh `auth-service`).
* **Thành viên 2**: Đảm nhiệm Parking Service (Nhánh `parking-service`).
* **Thành viên 3**: Đảm nhiệm Booking Service (Nhánh `booking-service`).
* **Thành viên 4**: Đảm nhiệm Payment & Report Service (Nhánh `payment-report-services`).
* **Thành viên 5**: Đảm nhiệm Frontend & Docker Compose Deployment (Nhánh `main` / `deployment`).
