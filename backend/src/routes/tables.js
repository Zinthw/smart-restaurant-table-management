const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { status, location, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

    let query = 'SELECT * FROM tables WHERE 1=1';
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (location) {
      params.push(location);
      query += ` AND location = $${params.length}`;
    }
    const validSort = ['table_number', 'capacity', 'created_at'];
    const sort = validSort.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder === 'asc' ? 'asc' : 'desc';
    query += ` ORDER BY ${sort} ${order}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM tables WHERE id = $1', [req.params.id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Table not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { table_number, capacity, location, description, status = 'active' } = req.body;

    if (!table_number || !capacity || !location) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }
    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Capacity must be 1–20' });
    }

    const dup = await db.query('SELECT 1 FROM tables WHERE table_number = $1', [table_number]);
    if (dup.rowCount > 0) {
      return res.status(400).json({ error: 'TABLE_NUMBER_EXISTS', message: 'Table number already exists' });
    }

    const insert = await db.query(
      `INSERT INTO tables(table_number, capacity, location, description, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [table_number, capacity, location, description || null, status]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { table_number, capacity, location, description, status } = req.body;

    if (!table_number || !capacity || !location) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Missing required fields' });
    }

    if (capacity < 1 || capacity > 20) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Capacity must be 1–20' });
    }

    const dup = await db.query(
      'SELECT 1 FROM tables WHERE table_number = $1 AND id <> $2',
      [table_number, req.params.id]
    );
    if (dup.rowCount > 0) {
      return res.status(400).json({ error: 'TABLE_NUMBER_EXISTS', message: 'Table number already exists' });
    }

    const update = await db.query(
      `UPDATE tables
       SET table_number = $1,
           capacity = $2,
           location = $3,
           description = $4,
           status = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [table_number, capacity, location, description || null, status || 'active', req.params.id]
    );

    if (!update.rows[0]) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Table not found' });
    }

    res.json(update.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid status' });
    }
    const result = await db.query(
      `UPDATE tables SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Table not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
