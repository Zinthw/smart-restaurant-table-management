const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tablesRouter = require('./routes/tables');
const qrRouter = require('./routes/qr');
const publicRouter = require('./routes/public');
const errorHandler = require('./middleware/errorHandler');

const authRouter = require('./routes/auth');
const { requireAuth, requireRole } = require('./middleware/authMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Auth (Login/Register) 
app.use('/api/auth', authRouter);

// API Admin (Tables, QR)
// Yêu cầu: Phải đăng nhập VÀ Phải là 'admin'
app.use('/api/admin/tables', requireAuth, requireRole('admin'), tablesRouter);
app.use('/api/admin/tables', requireAuth, requireRole('admin'), qrRouter);

// API cho Waiter (sau này làm thêm)
// app.use('/api/waiter/orders', requireAuth, requireRole(['waiter', 'admin']), waiterRouter);

// Public Routes (Dành cho khách quét QR). Frontend sẽ gọi /api/menu/verify
app.use('/api/menu', publicRouter);

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
