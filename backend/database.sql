-- 1. Kích hoạt extension để hỗ trợ tạo UUID (Quan trọng)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Xóa bảng cũ nếu tồn tại (Giúp chạy lại script không bị lỗi trùng)
DROP TABLE IF EXISTS tables;

-- 3. Tạo bảng
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

CREATE TABLE IF NOT EXISTS menu_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        image_url TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP -- Soft Delete
      );
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_name_not_deleted ON menu_categories (name) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES menu_categories(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold_out', 'hidden')),
        is_chef_recommended BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP -- Soft Delete
      );
CREATE INDEX IF NOT EXISTS idx_items_category ON menu_items(category_id);

CREATE TABLE IF NOT EXISTS menu_item_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS modifier_groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        selection_type VARCHAR(20) DEFAULT 'single' CHECK (selection_type IN ('single', 'multiple')), 
        is_required BOOLEAN DEFAULT false,
        min_selection INT DEFAULT 0,
        max_selection INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS modifier_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
        sort_order INT DEFAULT 0,
        PRIMARY KEY (menu_item_id, modifier_group_id)
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