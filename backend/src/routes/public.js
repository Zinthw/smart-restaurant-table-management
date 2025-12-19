const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.get('/verify', async (req, res, next) => {
  try {
    const { tableId, token } = req.query;

    if (!tableId || !token) {
      return res.status(400).json({ valid: false, code: 'MISSING_PARAMS', message: 'Missing authentication parameters.' });
    }

    try {
      jwt.verify(token, process.env.QR_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        valid: false, 
        code: 'TOKEN_INVALID_SIGNATURE', 
        message: 'Invalid QR code signature.' 
      });
    }

    const { rows } = await db.query('SELECT * FROM tables WHERE id = $1', [tableId]);
    const table = rows[0];

    if (!table) {
      return res.status(404).json({ valid: false, code: 'TABLE_NOT_FOUND', message: 'Table not found.' });
    }

    if (table.qr_token !== token) {
      return res.status(401).json({ 
        valid: false, 
        code: 'TOKEN_EXPIRED_OR_REGENERATED', 
        message: 'This QR code is no longer valid. Please ask staff for assistance.' 
      });
    }

    if (table.status !== 'active') {
       return res.status(403).json({ 
        valid: false, 
        code: 'TABLE_INACTIVE', 
        message: 'This table is currently inactive.' 
      });
    }

    res.json({
      valid: true,
      table: {
        id: table.id,
        number: table.table_number,
        name: `Table ${table.table_number}`
      }
    });

  } catch (err) {
    next(err);
  }
});

module.exports = router;