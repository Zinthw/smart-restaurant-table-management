# Smart Restaurant Backend API

Backend server cho hệ thống quản lý nhà hàng (Table Management & Staff Auth).
Dự án được xây dựng bằng **Node.js**, **Express** và **PostgreSQL**.

## 📋 Tính năng chính

- **Quản lý Bàn (CRUD):** Thêm, sửa, xóa, cập nhật trạng thái bàn.
- **QR Code:** Tạo mã QR, tải xuống (PNG/PDF/Zip), và xác thực token.
- **Phân quyền (RBAC):** Hệ thống đăng nhập đa quyền (Admin, Waiter, Staff, Kitchen).
- **Bảo mật:** JWT Authentication, Password Hashing (Bcrypt), Middleware bảo vệ 2 lớp.

## 🛠️ Yêu cầu hệ thống

- Node.js (v14 trở lên)
- PostgreSQL (v12 trở lên)

## 🚀 Cài đặt & Chạy dự án

### 1. Cấu hình môi trường

Copy file `.env.example` thành `.env` (hoặc tạo mới) và điền thông tin:

```env
PORT=4000
# Thay password_cua_ban bằng mật khẩu PostgreSQL của bạn
DATABASE_URL=postgresql://postgres:password_cua_ban@localhost:5432/smart_restaurant
# Secret key cho JWT (tự nghĩ ra chuỗi bất kỳ)
JWT_SECRET=bi_mat_khong_bat_mi_123456
QR_JWT_SECRET=khoa_bi_mat_cho_qr_code
CLIENT_BASE_URL=http://localhost:5173
```

### 2. Cài đặt thư viện

cd backend
npm install

### 2. Khởi tạo Database (Migration)

node migrate.js

Tài khoản Admin khởi tạo sẵn: email `admin@restaurant.com` / pass `123456` (Không thể tạo mới tài khoản Admin khác)

### 2. Cài đặt thư viện

npm run dev
