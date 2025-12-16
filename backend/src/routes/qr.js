const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

const router = express.Router();

function buildQrUrl(tableId, token) {
  const base = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
  return `${base}/menu?table=${tableId}&token=${token}`;
}

router.post('/:id/qr/generate', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM tables WHERE id = $1', [req.params.id]);
    const table = rows[0];
    if (!table) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Table not found' });
    }

    const payload = {
      tableId: table.id,
      restaurantId: 'demo-restaurant',
    };
    const token = jwt.sign(payload, process.env.QR_JWT_SECRET, { expiresIn: '30d' });
    const url = buildQrUrl(table.id, token);

    await db.query(
      `UPDATE tables
       SET qr_token = $1, qr_token_created_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      [token, table.id]
    );

    const qrImageDataUrl = await QRCode.toDataURL(url);

    res.json({
      tableId: table.id,
      url,
      qrImageDataUrl,
      qrTokenCreatedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id/qr/download', async (req, res, next) => {
  try {
    const { format = 'png' } = req.query;
    const { rows } = await db.query('SELECT * FROM tables WHERE id = $1', [req.params.id]);
    const table = rows[0];
    if (!table || !table.qr_token) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Table or QR not found' });
    }

    const url = buildQrUrl(table.id, table.qr_token);

    if (format === 'png') {
      const opts = { type: 'png', width: 500 };
      QRCode.toBuffer(url, opts, (err, buffer) => {
        if (err) return next(err);
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="table-${table.table_number}.png"`);
        res.send(buffer);
      });
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="table-${table.table_number}.pdf"`);

      QRCode.toDataURL(url, (err, dataUrl) => {
        if (err) return next(err);
        const img = dataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(img, 'base64');

        doc.fontSize(24).text(`Table ${table.table_number}`, { align: 'center' });
        doc.moveDown();
        doc.image(buffer, (doc.page.width - 200) / 2, 150, { width: 200 });
        doc.moveDown();
        doc.fontSize(16).text('Scan to Order', { align: 'center' });
        doc.end();
      });

      doc.pipe(res);
    } else {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid format' });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
