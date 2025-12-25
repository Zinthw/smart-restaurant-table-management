const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM menu_categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at DESC"
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, image_url, status, sort_order } = req.body;
    
    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Category name is required' });
    if (name.length > 100) return res.status(400).json({ message: 'Category name is too long (max 100 characters)' });
    if (sort_order !== undefined && sort_order < 0) return res.status(400).json({ message: 'Sort order must be >= 0' });

    const dup = await db.query("SELECT 1 FROM menu_categories WHERE name = $1 AND deleted_at IS NULL", [name]);
    if (dup.rowCount > 0) return res.status(400).json({ message: 'Category name already exists' });

    const { rows } = await db.query(
      `INSERT INTO menu_categories (name, description, image_url, status, sort_order) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, description, image_url, status || 'active', sort_order || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, image_url, status, sort_order } = req.body;

    if (!name || name.trim().length === 0) return res.status(400).json({ message: 'Category name is required' });
    if (sort_order !== undefined && sort_order < 0) return res.status(400).json({ message: 'Sort order must be >= 0' });

    const { rows } = await db.query(
      `UPDATE menu_categories 
       SET name = $1, description = $2, image_url = $3, status = $4, sort_order = $5, updated_at = NOW() 
       WHERE id = $6 AND deleted_at IS NULL RETURNING *`,
      [name, description, image_url, status, sort_order || 0, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Category not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active or inactive' });
    }

    const { rows } = await db.query(
      `UPDATE menu_categories SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND deleted_at IS NULL RETURNING *`,
      [status, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Category not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE menu_categories SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) { next(err); }
});

module.exports = router;