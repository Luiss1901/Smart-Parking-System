# Smart Parking System - Hệ thống Đặt chỗ và Quản lý Bãi Đỗ Xe Thông Minh

Hệ thống **Smart Parking** là một ứng dụng đồ án được xây dựng theo kiến trúc **Microservices**. Hệ thống cho phép khách hàng đặt chỗ đỗ xe trực tuyến, thanh toán trực tiếp qua cổng thanh toán VNPay và giúp Quản trị viên (Admin) giám sát, quản lý bãi đỗ cũng như theo dõi doanh thu.

---

## 🏗 Kiến trúc Hệ thống (Microservices Architecture)

Dự án được chia thành các dịch vụ độc lập (Microservices), giao tiếp với nhau trong mạng nội bộ thông qua các RESTful API. Hệ thống bao gồm:

*   **API Gateway (`8080`):** Định tuyến request từ Frontend đến các dịch vụ backend tương ứng.
*   **Frontend (`5173` / Nginx `80`):** Ứng dụng Single Page Application (ReactJS/Vite) giao tiếp với API Gateway.
*   **Authentication Service (`3001`):** Quản lý đăng ký, đăng nhập và cấp phát mã xác thực (JWT Token).
*   **User Management Service (`3008`):** Quản lý hồ sơ cá nhân và danh sách người dùng (dành cho Admin).
*   **Parking Service (`3002`):** Quản lý cấu trúc bãi đỗ, sơ đồ các ô đỗ, loại xe (Ô tô/Xe máy) và trạng thái (Trống/Đã đặt/Đang sử dụng).
*   **Booking Service (`3003`):** Chịu trách nhiệm logic đặt chỗ, hủy chỗ và gia hạn thời gian đỗ. Giao tiếp chéo với *Parking Service* để giữ chỗ.
*   **Payment Service (`3004`):** Xử lý thanh toán thông qua **VNPay Sandbox**. Bao gồm chức năng Nhận diện Webhook (IPN) ngầm và API Hoàn tiền (Refund) thật.
*   **Report Service (`3005`):** Tính toán doanh thu và tỷ lệ sử dụng bãi đỗ dựa trên dữ liệu thật theo thời gian thực (Real-time).
*   **Notification Service (`3006`):** Dịch vụ gửi Email thông báo khi Khách hàng thanh toán thành công hoặc được Admin Hoàn tiền.

Mỗi service backend (trừ API Gateway) đều có kết nối tới một cơ sở dữ liệu **PostgreSQL** của riêng mình (database-per-service pattern).

---

## 🚀 Hướng Dẫn Cài Đặt (Dành cho Giảng Viên / Reviewer)

Dự án đã được đóng gói toàn bộ bằng **Docker** nên việc cài đặt rất đơn giản. Không cần phải cài NodeJS hay PostgreSQL trên máy thật.

### Yêu cầu tiên quyết:
*   Máy tính đã cài đặt **Docker** và **Docker Desktop** (nếu dùng Windows/Mac).
*   Cổng (Port) `8080`, `5432`, `5173` không bị ứng dụng khác chiếm dụng.

### Các bước khởi chạy:

**Bước 1:** Clone mã nguồn về máy:
```bash
git clone https://github.com/Luiss1901/Smart-Parking-System.git
cd Smart-Parking-System
```

**Bước 2:** Khởi chạy hệ thống bằng lệnh Docker Compose:
```bash
docker compose up --build -d
```
> **Lưu ý:** Lần đầu tiên chạy có thể mất từ 2-5 phút để tải các Docker Images (Node, Nginx, PostgreSQL) và compile mã nguồn. 

**Bước 3:** Kiểm tra trạng thái các container:
```bash
docker compose ps
```
Đảm bảo tất cả các container đều ở trạng thái **Up / Running**.

**Bước 4:** Trải nghiệm hệ thống:
*   Truy cập **Frontend** tại địa chỉ: `http://localhost:5173` (hoặc mở trực tiếp port của Frontend).
*   Các API (nếu muốn test qua Postman) đi qua API Gateway: `http://localhost:8080`.

---

## 🔑 Tài Khoản Demo

Hệ thống đã được khởi tạo sẵn một số tài khoản và dữ liệu bãi đỗ mặc định khi database mới sinh ra.

*   **Tài khoản Quản trị viên (Admin):**
    *   **Email:** `admin@admin.com`
    *   **Password:** `admin` (hoặc `123456` tùy bản dump DB)
*   **Tài khoản Khách hàng (User):**
    *   **Email:** `user@user.com`
    *   **Password:** `user`

*(Khuyến nghị: Bạn có thể tự Đăng ký một tài khoản Khách hàng mới ngay trên giao diện web để test luồng từ đầu).*

---

## 🛠 Tính Năng Trọng Tâm

1.  **Luồng Đặt chỗ & Thanh toán VNPay:**
    *   Người dùng chọn 1 chỗ đỗ trống `AVAILABLE` (loại xe tự động nhận diện khớp với cấu hình chỗ đỗ).
    *   Chuyển sang trang thanh toán giả lập (Sandbox) của VNPay (sử dụng ngân hàng NCB).
    *   Sau khi thanh toán, hệ thống ghi nhận `PAID` thông qua IPN ngầm và gửi Email xác nhận.
2.  **Luồng Hủy / Hoàn Tiền (Refund):**
    *   Admin truy cập trang Quản lý, chọn một hóa đơn bị lỗi (hoặc khách yêu cầu) và nhấn Hoàn Tiền.
    *   Hệ thống sẽ gọi API Refund của VNPay.
    *   Sau khi Refund thành công, *Booking Service* lập tức hủy phiếu đặt chỗ, tiếp đó *Parking Service* giải phóng chỗ đỗ.
3.  **Bảo vệ toàn vẹn Dữ liệu:**
    *   Admin không thể Xóa (Delete) chỗ đỗ xe nếu nó đang có người dùng (Trạng thái `RESERVED` hoặc `OCCUPIED`).
    *   Lọc dữ liệu lịch sử chuẩn: Khách hàng nào chỉ xem được hóa đơn / lịch sử đặt chỗ của khách hàng đó.

---

*Project được phát triển phục vụ Báo cáo Đồ Án / Đề Tài Tốt Nghiệp.*
