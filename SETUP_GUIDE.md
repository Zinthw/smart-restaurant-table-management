# 🚀 Hướng dẫn chạy dự án Smart Restaurant

## Yêu cầu hệ thống

- Node.js (v16 trở lên)
- PostgreSQL (v12 trở lên)
- npm hoặc yarn

## Bước 1: Setup Database

### 1.1. Tạo database PostgreSQL

```sql
CREATE DATABASE smart_restaurant;
```

### 1.2. Cập nhật thông tin kết nối

Mở file `backend/.env` và cập nhật thông tin database của bạn:

```env
DATABASE_URL=postgres://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/smart_restaurant
```

Ví dụ:

- Nếu username là `postgres` và password là `123456`:
  ```
  DATABASE_URL=postgres://postgres:123456@localhost:5432/smart_restaurant
  ```

## Bước 2: Cài đặt Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Bước 3: Migrate Database

Chạy lệnh sau để tạo tables và dữ liệu mẫu:

```bash
cd backend
npm run migrate
```

Bạn sẽ thấy thông báo: `✅ Migration thành công!`

## Bước 4: Chạy ứng dụng

### Chạy Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại: http://localhost:4000

### Chạy Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: http://localhost:5173

## Bước 5: Đăng nhập

Mở trình duyệt và truy cập: http://localhost:5173

**Thông tin đăng nhập Admin mặc định:**

- Email: `admin@restaurant.com`
- Password: `admin123`

## 📋 Các Role trong hệ thống

1. **admin** - Quản trị viên (Toàn quyền)
2. **staff** - Nhân viên
3. **waiter** - Phục vụ
4. **kitchen** - Bếp

## 🔧 Các API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký (chỉ cho staff, waiter, kitchen)

### Admin - Tables Management

- `GET /api/admin/tables` - Lấy danh sách bàn
- `POST /api/admin/tables` - Tạo bàn mới
- `PUT /api/admin/tables/:id` - Cập nhật bàn
- `DELETE /api/admin/tables/:id` - Xóa bàn
- `POST /api/admin/tables/:id/qr` - Tạo QR code cho bàn

### Public (Khách hàng)

- `GET /api/menu/verify/:token` - Verify QR code

## 🐛 Xử lý lỗi thường gặp

### Lỗi kết nối database

```
error: password authentication failed for user "postgres"
```

**Giải pháp:** Kiểm tra lại username và password trong file `backend/.env`

### Lỗi port đã được sử dụng

```
Error: listen EADDRINUSE: address already in use :::4000
```

**Giải pháp:** Thay đổi PORT trong file `backend/.env` hoặc tắt ứng dụng đang chạy trên port đó

### Lỗi CORS

**Giải pháp:** Đảm bảo `CLIENT_BASE_URL` trong `backend/.env` trùng với URL frontend

## 📝 Ghi chú

- Mật khẩu admin mặc định đã được hash bằng bcrypt
- Token JWT có thời hạn 1 ngày
- Chỉ admin mới có thể quản lý bàn và tạo QR code
- Không thể đăng ký tài khoản admin qua API (chỉ có thể tạo trong database)

## 🎯 Tính năng đã hoàn thành

✅ Đăng nhập/Đăng ký với JWT
✅ Quản lý bàn ăn (CRUD)
✅ Tạo QR code cho từng bàn
✅ Phân quyền theo role
✅ Middleware xác thực

## 📚 Tài liệu API đầy đủ

Xem chi tiết tại: `docs/API_DOCUMENTATION.md`
