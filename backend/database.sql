-- 1. Kích hoạt extension để hỗ trợ tạo UUID (Quan trọng)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Xóa bảng cũ nếu tồn tại (Giúp chạy lại script không bị lỗi trùng)
DROP TABLE IF EXISTS tables;

-- 3. Tạo bảng tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(50) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0 AND capacity <= 20),
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    qr_token VARCHAR(500),
    qr_token_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(table_number)
);

-- 4. (Tùy chọn) Thêm sẵn một vài dữ liệu mẫu để test
INSERT INTO tables (table_number, capacity, location, description) VALUES 
('T-01', 4, 'Indoor', 'Gần cửa sổ'),
('T-02', 2, 'Outdoor', 'Ban công'),
('T-03', 6, 'VIP', 'Phòng lạnh');