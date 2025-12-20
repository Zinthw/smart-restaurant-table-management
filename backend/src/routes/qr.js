const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');
const archiver = require('archiver');

const router = express.Router();

function buildQrUrl(tableId, token) {
  const base = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
  return `${base}/menu?table=${tableId}&token=${token}`;
}

// Thêm endpoint tải tất cả QR
// GET /api/admin/tables/qr/download-all?format=png|pdf
router.get('/qr/download-all', async (req, res, next) => {
  try {
    const { format = 'png' } = req.query;
    
    const { rows: tables } = await db.query(
      "SELECT * FROM tables WHERE status = 'active' AND qr_token IS NOT NULL ORDER BY table_number"
    );

    if (tables.length === 0) {
      return res.status(400).json({ message: 'Không có bàn nào đang hoạt động (active) hoặc chưa tạo QR để tải.' });
    }

    if (format === 'png') {
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="all-qrs.zip"');
      
      archive.pipe(res);

      for (const table of tables) {
        const url = buildQrUrl(table.id, table.qr_token);
        const buffer = await QRCode.toBuffer(url, { type: 'png', width: 500, margin: 2 });
        archive.append(buffer, { name: `Table-${table.table_number}.png` });
      }
      
      await archive.finalize();

    } else if (format === 'pdf') {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="all-qrs.pdf"');
      
      doc.pipe(res);

      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const url = buildQrUrl(table.id, table.qr_token);
        
        if (i > 0) doc.addPage();

        doc.fontSize(30).text(`Table ${table.table_number}`, { align: 'center' });
        doc.moveDown();
        
        const qrDataUrl = await QRCode.toDataURL(url, { margin: 1 });
        const img = qrDataUrl.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(img, 'base64');

        doc.image(buffer, (doc.page.width - 300) / 2, 150, { width: 300 });

        doc.y = 460;
        doc.fontSize(20).text('Scan to Order', { align: 'center' });
        doc.fontSize(12).fillColor('gray').text(`(${table.location})`, { align: 'center' });
      }

      doc.end();

    } else {
      return res.status(400).json({ message: 'Invalid format. Use ?format=png or ?format=pdf' });
    }

  } catch (err) {
    next(err);
  }
});


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

        // FIX: Đặt con trỏ xuống toạ độ Y = 320 (vì ảnh bắt đầu từ 100 + cao 200 = 300)
        doc.y = 320;

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

// Regenerate QR codes for all active tables
router.post('/qr/regenerate-all', async (req, res, next) => {
  try {
    // Lấy tất cả các bàn đang hoạt động
    const { rows: tables } = await db.query("SELECT * FROM tables WHERE status = 'active'");

    if (tables.length === 0) {
      return res.status(400).json({ message: 'No active tables found to regenerate.' });
    }

    console.log(`Starting bulk regeneration for ${tables.length} tables...`);

    const updatePromises = tables.map(async (table) => {
      const payload = {
        tableId: table.id,
        restaurantId: 'demo-restaurant',
        // Thêm timestamp hiện tại vào payload để đảm bảo token luôn mới
        generatedAt: Date.now() 
      };

      const newToken = jwt.sign(payload, process.env.QR_JWT_SECRET, { expiresIn: '30d' });

      // Cập nhật vào Database
      return db.query(
        `UPDATE tables 
         SET qr_token = $1, qr_token_created_at = NOW(), updated_at = NOW() 
         WHERE id = $2`,
        [newToken, table.id]
      );
    });

    await Promise.all(updatePromises);

    console.log("Bulk regeneration completed.");

    res.json({
      success: true,
      message: `Successfully regenerated QR codes for ${tables.length} tables.`,
      updatedCount: tables.length
    });

  } catch (err) {
    console.error("Bulk Regenerate Error:", err);
    next(err);
  }
});

module.exports = router;
