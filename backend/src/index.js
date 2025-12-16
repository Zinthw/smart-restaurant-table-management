const express = require('express');
const cors = require('cors');
require('dotenv').config();

const tablesRouter = require('./routes/tables');
const qrRouter = require('./routes/qr');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/admin/tables', tablesRouter);
app.use('/api/admin/tables', qrRouter);

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
