require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Kết nối Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  try {
    console.log('🔄 Đang chạy migration...');
    
    // 1. Cài đặt Extension UUID
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    

    // Xóa bảng cũ để tạo bảng mới.
    // await pool.query(`DROP TABLE IF EXISTS menu_item_photos CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS menu_item_modifier_groups CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS modifier_options CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS modifier_groups CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS menu_items CASCADE;`);
    // await pool.query(`DROP TABLE IF EXISTS menu_categories CASCADE;`);

    // 2. Tạo bảng TABLES 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tables (
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
    `);
    console.log('✅ Table "tables" ready');

    // Tạo bảng USERS 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'waiter', 'kitchen')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "users" ready');

    // MENU CATEGORIES (Danh mục món)
    await pool.query(`
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
    `);
    console.log('✅ Table "menu_categories" ready');

    // MENU ITEMS (Món ăn)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID REFERENCES menu_categories(id),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'sold_out', 'hidden')),
        is_chef_recommended BOOLEAN DEFAULT false,
        prep_time_minutes INT DEFAULT 15 CHECK (prep_time_minutes >= 0 AND prep_time_minutes <= 240),
        order_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP -- Soft Delete
      );
      CREATE INDEX IF NOT EXISTS idx_items_category ON menu_items(category_id);
    `);
    console.log('✅ Table "menu_items" ready');

    // Add columns if they don't exist (for existing databases)
    await pool.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='prep_time_minutes') THEN
          ALTER TABLE menu_items ADD COLUMN prep_time_minutes INT DEFAULT 15 CHECK (prep_time_minutes >= 0 AND prep_time_minutes <= 240);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='menu_items' AND column_name='order_count') THEN
          ALTER TABLE menu_items ADD COLUMN order_count INT DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('✅ Columns "prep_time_minutes" and "order_count" ensured');

    // MENU ITEM PHOTOS (Ảnh món) 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_item_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        photo_url TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "menu_item_photos" ready');

    // MODIFIER GROUPS (Nhóm Topping/Size) 
    await pool.query(`
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
    `);
    console.log('✅ Table "modifier_groups" ready');

    // MODIFIER OPTIONS (Các lựa chọn con) 
    await pool.query(`
      CREATE TABLE IF NOT EXISTS modifier_options (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "modifier_options" ready');

    // LIÊN KẾT MÓN - NHÓM MODIFIER (Many-to-Many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_item_modifier_groups (
        menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
        sort_order INT DEFAULT 0,
        PRIMARY KEY (menu_item_id, modifier_group_id)
      );
    `);
    console.log('✅ Table "menu_item_modifier_groups" ready');

    // Tạo User Admin mẫu (Seeding nếu chạy lần đầu)
    // const adminEmail = 'admin@restaurant.com';
    // const hash = await bcrypt.hash('123456', 10);
    
    // await pool.query(`
    //   INSERT INTO users (email, password_hash, role, status)
    //   VALUES ($1, $2, 'admin', 'active')
    // `, [adminEmail, hash]);
    
    // console.log(`🎉 Tạo Admin mẫu thành công: ${adminEmail} / 123456`);

    console.log('✅ MIGRATION HOÀN TẤT!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration thất bại:', err);
    process.exit(1);
  }
}

migrate();