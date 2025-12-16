# Smart Restaurant - Table Management Skeleton

This repo contains a minimal skeleton for the Week Assignment: Table Management.

## Structure

- backend/ – Node.js + Express API for table CRUD and QR codes
- frontend/ – React (Vite) admin UI for managing tables and QR

## Backend

```bash
cd backend
cp .env.example .env   # update DATABASE_URL and QR_JWT_SECRET
npm install
npm run dev
```

Create the `tables` table in your database (PostgreSQL example):

```sql
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
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

By default, frontend runs on http://localhost:5173 and backend on http://localhost:4000.
Set VITE_API_BASE_URL in a .env file inside frontend/ if needed.
