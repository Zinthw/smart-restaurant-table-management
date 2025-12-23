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
    console.log('⚠️ Đang reset bảng users...');
    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // 2. Tạo bảng TABLES (Giữ nguyên)
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
    console.log('✅ Bảng "tables" đã sẵn sàng.');

    // 3. Tạo bảng USERS (Cấu trúc mới: dùng email)
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
    console.log('✅ Bảng "users" (mới) đã sẵn sàng.');

    // 4. Tạo User Admin mẫu (Seeding)
    const adminEmail = 'admin@restaurant.com';
    // Vì vừa Drop bảng nên chắc chắn chưa có user, ta insert luôn
    const hash = await bcrypt.hash('123456', 10);
    
    await pool.query(`
      INSERT INTO users (email, password_hash, role, status)
      VALUES ($1, $2, 'admin', 'active')
    `, [adminEmail, hash]);
    
    console.log(`🎉 Tạo Admin mẫu thành công: ${adminEmail} / 123456`);

    console.log('✅ MIGRATION HOÀN TẤT!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration thất bại:', err);
    process.exit(1);
  }
}

migrate();