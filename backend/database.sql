-- 1. Kích hoạt extension để hỗ trợ tạo UUID (Quan trọng)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Xóa bảng cũ nếu tồn tại (Giúp chạy lại script không bị lỗi trùng)
DROP TABLE IF EXISTS tables;

-- 3. Tạo bảng tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL CHECK (capacity > 0 AND capacity <= 20),
    location VARCHAR(100),
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    qr_token TEXT,
    qr_token_created_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'waiter', 'kitchen')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

-- Thêm user admin mặc định (password: admin123)
-- Hash được tạo bằng bcrypt với salt rounds = 10
INSERT INTO users (email, password_hash, role, status) 
VALUES ('admin@restaurant.com', '$2b$10$rHj4EqBqHPZ.VqWRyNxn0Op7iGmYqGfLvLbDPHxqRt5Rd3hTbQm0K', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
      
-- 4. Thêm indexes để tối ưu tìm kiếm
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_location ON tables(location);

-- 4. (Tùy chọn) Thêm sẵn một vài dữ liệu mẫu để test
INSERT INTO tables (table_number, capacity, location, description) VALUES 
('T-01', 4, 'Indoor', 'Gần cửa sổ'),
('T-02', 2, 'Outdoor', 'Ban công'),
('T-03', 6, 'VIP', 'Phòng lạnh');