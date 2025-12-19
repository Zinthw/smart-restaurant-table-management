# Tài liệu API Smart Restaurant - Quản lý Bàn

---

## 1. Tổng quan
Tài liệu này mô tả các endpoint API để quản lý bàn ăn và vòng đời của mã QR (tạo, làm mới, hủy). Toàn bộ các API dưới đây (trừ API Verify) đều yêu cầu quyền Admin.

### Xác thực (Authentication)
* **Admin Endpoints:** Yêu cầu header `Authorization: Bearer <admin_token>`.
* **Public Endpoints:** Không cần đăng nhập (dành cho khách quét QR).

### Base URL
* Dev: `http://localhost:5000/api`
* Prod: `https://api.smart-restaurant.com`

---

## 2. Đặc tả Token QR (Bảo mật)

Mã QR không chỉ chứa ID bàn mà còn chứa một **JWT (JSON Web Token)** đã được ký để chống giả mạo.

**Thuật toán ký:** `HS256` (HMAC SHA-256)
+ **Thời gian hết hạn:** 
  + **Bàn cố định:** Không hết hạn (hoặc hạn rất dài, ví dụ: 5 năm).
  + **Yêu cầu bảo mật cao:** Có thể set hết hạn sau 24h (tùy config).

**Cấu trúc Payload:**

```json
{
  "tableId": "uuid-v4-string",       // ID duy nhất của bàn
  "restaurantId": "restaurant-01",   // ID nhà hàng (để mở rộng sau này)
  "iat": 1716537600,                 // Thời gian tạo (Timestamp)
  "exp": 1719143200,                 // Thời gian hết hạn (optional)
  "randomHash": "a1b2c3d4..."        // Chuỗi ngẫu nhiên để đảm bảo token mới khác token cũ khi regenerate
}
```

**Định dạng URL trong QR (Link khách quét):** https://domain-your-frontend.com/menu?table={tableId}&token={signedJwtToken}

**Lưu ý:** `domain-your-frontend.com` là placeholder, sẽ được thay bằng domain thực tế của hệ thống frontend khi deploy.


---

## 3. Admin Endpoints (Quản lý Bàn)

### 3.1. Tạo Bàn Mới

Tạo bàn mới và tự động sinh mã QR token lần đầu tiên.
+ **URL:** /admin/tables
+ **Method:** POST
+ **Auth:** Required

**Request Body:**

```json
{
  "tableNumber": "T-01",      // Bắt buộc, Duy nhất
  "capacity": 4,              // Bắt buộc, Min: 1, Max: 20
  "location": "Indoor",       // Chọn: "Indoor", "Outdoor", "Patio", "VIP"
  "description": "Gần cửa sổ" // Tùy chọn
}
```

**Phản hồi thành công (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "tableNumber": "T-01",
    "capacity": 4,
    "location": "Indoor",
    "status": "active",
    "qrToken": "eyJhbGciOiJIUzI1Ni..."
  }
}
```

**Phản hồi lỗi (400 Bad Request):**
+ "Số bàn này đã tồn tại"
+ "Sức chứa (capacity) phải từ 1 đến 20"

### 3.2. Lấy danh sách bàn

Lấy tất cả bàn có hỗ trợ lọc và sắp xếp.
+ **URL:** /admin/tables
+ **Method:** GET
+ **Auth:** Required

**Query Parameters (Tham số trên URL):**
+ `location:` Lọc theo khu vực (ví dụ: `Indoor`)
+ `status:` Lọc theo trạng thái (`active`, `inactive`)
+ `sortBy:` Sắp xếp theo (`tableNumber`, `capacity`, `createdAt`)

**Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "550e8400...",
      "tableNumber": "T-01",
      "capacity": 4,
      "location": "Indoor",
      "status": "active"
    },
    {
      "id": "661f9511...",
      "tableNumber": "T-02",
      "capacity": 2,
      "location": "Outdoor",
      "status": "inactive"
    }
  ]
}
```

### 3.3. Cập nhật thông tin bàn

Sửa các thông tin cơ bản của bàn.
+ **URL:** /admin/tables/:id
+ **Method:** PUT
+ **Auth:** Required

**Request Body:**

```json
{
  "tableNumber": "T-01-VIP",
  "capacity": 6,
  "location": "VIP",
  "description": "Đã đổi thành bàn VIP"
}
```

**Phản hồi thành công (200 OK):** Trả về object bàn đã được cập nhật.

### 3.4. Cập nhật trạng thái (Xóa mềm)

Kích hoạt hoặc vô hiệu hóa một bàn.
+ **URL:** /admin/tables/:id/status
+ **Method:** PATCH
+ **Auth:** Required

**Request Body:**

```json
{
  "status": "inactive" // hoặc "active"
}
```

**Lưu ý:** Nếu set trạng thái thành inactive, Backend phải kiểm tra xem bàn đó có đang phục vụ khách (có active order) không. Nếu có, phải trả về cảnh báo hoặc lỗi.

### 3.5. Lấy chi tiết một bàn

Lấy đầy đủ thông tin của một bàn cụ thể.
+ **URL:** /admin/tables/:id
+ **Method:** GET
+ **Auth:** Required

**Phản hồi thành công (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400...",
    "tableNumber": "T-01",
    "capacity": 4,
    "location": "Indoor",
    "status": "active",
    "description": "Gần cửa sổ",
    "qrTokenCreatedAt": "2025-12-19T09:30:00Z"
  }
}
```

**Lưu ý:** Endpoint này chỉ dùng để xem thông tin, không thay đổi trạng thái bàn.

---

## 4. Các thao tác với QR Code

### 4.1. Làm mới mã QR (Regenerate)

Hủy token cũ và tạo token mới (dùng khi mã bị lộ hoặc bị hỏng).
+ **URL:** /admin/tables/:id/qr/generate
+ **Method:** POST
+ **Auth:** Required

**Phản hồi thành công (200 OK):**
```json
{
  "success": true,
  "message": "Đã tạo mã QR mới thành công. Token cũ đã bị hủy.",
  "data": {
    "newToken": "eyJhbGciOiJIUzI1Ni...",
    "qrUrl": "https://domain-your-frontend.com/menu?table=...&token=..."
  }
}
```

**Lưu ý:** Token cũ sau khi regenerate phải bị backend từ chối nếu được verify lại.


### 4.2. Tải mã QR

Tải ảnh QR hoặc file PDF để in ấn.
+ **URL:** /admin/tables/:id/qr/download
+ **Method:** GET
+ **Auth:** Required
+ **Query Parameters:** format: png | pdf

**Phản hồi:** Trả về file binary (Content-Type: `image/png` hoặc `application/pdf`).

### 4.3. Tải tất cả QR (Batch Download)

Tải toàn bộ mã QR của tất cả các bàn.
+ **URL:** /admin/tables/qr/download-all
+ **Method:** GET
+ **Auth:** Required
+ **Query Parameters:** format: zip (mặc định - tải tập hợp ảnh PNG) hoặc pdf (file in ấn tổng hợp)

**Phản hồi:** Trả về file binary (Content-Type: `application/zip` hoặc `application/pdf`).

---

## 5. API Public / Phía Khách hàng

### 5.1. Xác thực Token (Khi quét QR)

Endpoint này được Frontend gọi ngay khi khách quét mã QR để kiểm tra xem mã có hợp lệ không.
+ **URL:** /menu/verify (hoặc /api/tables/verify-token)
+ **Method:** GET
+ **Auth:** Không yêu cầu (Public)
+ **Query Parameters:** 
  + `tableId:` UUID của bàn.
  + `token:` Chuỗi JWT lấy từ URL.

**Phản hồi thành công (200 OK - Hợp lệ):**
```json
{
  "valid": true,
  "table": {
    "id": "550e8400...",
    "number": "T-01",
    "name": "Bàn số T-01"
  }
}
```

**Phản hồi lỗi (401 Unauthorized - Không hợp lệ):**
```json
{
  "valid": false,
  "code": "TOKEN_INVALID_OR_EXPIRED",
  "message": "Mã QR này không còn hiệu lực hoặc đã cũ. Vui lòng liên hệ nhân viên."
}
```

**Lưu ý:**
+ Token đã bị regenerate hoặc hết hạn phải bị backend từ chối.
+ Không được chỉ kiểm tra ở frontend.
+ Token không hợp lệ hoặc đã bị invalidate phải trả về HTTP 401 hoặc 403.