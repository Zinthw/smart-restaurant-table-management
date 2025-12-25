const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken'); 

const router = express.Router();

// API VERIFY QR CODE 
router.get('/verify', async (req, res, next) => {
  try {
    const { tableId, token } = req.query;

    if (!tableId || !token) {
      return res.status(400).json({ valid: false, code: 'MISSING_PARAMS', message: 'Missing authentication parameters.' });
    }

    // Verify JWT Signature
    try {
      jwt.verify(token, process.env.QR_JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ 
        valid: false, 
        code: 'TOKEN_INVALID_SIGNATURE', 
        message: 'Invalid QR code signature.' 
      });
    }

    // Check DB
    const { rows } = await db.query('SELECT * FROM tables WHERE id = $1', [tableId]);
    const table = rows[0];

    if (!table) {
      return res.status(404).json({ valid: false, code: 'TABLE_NOT_FOUND', message: 'Table not found.' });
    }

    // Check Token khớp trong DB (Chống dùng lại QR cũ)
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

// API LẤY MENU CHO KHÁCH 
router.get('/', async (req, res, next) => {
  try {
    const { 
      q, categoryId, chefRecommended, 
      page = 1, limit = 100,
      sort = 'created_at', order = 'desc' 
    } = req.query;

    // A. Lấy Danh Mục (Active)
    const catRes = await db.query(
      "SELECT * FROM menu_categories WHERE status = 'active' AND deleted_at IS NULL ORDER BY sort_order ASC"
    );
    const categories = catRes.rows;

    // B. Build Query Lấy Món Ăn
    let itemQuery = `
      SELECT 
        i.*, 
        p.photo_url as primary_photo 
      FROM menu_items i
      JOIN menu_categories c ON i.category_id = c.id
      LEFT JOIN menu_item_photos p ON i.id = p.menu_item_id AND p.is_primary = true
      WHERE i.deleted_at IS NULL 
        AND i.status IN ('available', 'sold_out')
        AND c.status = 'active'
    `;
    const params = [];
    let pIdx = 1;

    // Filters
    if (q) {
      itemQuery += ` AND i.name ILIKE $${pIdx++}`;
      params.push(`%${q}%`);
    }
    if (categoryId) {
      itemQuery += ` AND i.category_id = $${pIdx++}`;
      params.push(categoryId);
    }
    if (chefRecommended === 'true') {
      itemQuery += ` AND i.is_chef_recommended = true`;
    }

    // Sorting 
    const validSorts = ['price', 'name', 'created_at'];
    const sortCol = validSorts.includes(sort) ? `i.${sort}` : 'i.created_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';
    itemQuery += ` ORDER BY ${sortCol} ${sortDir}`;

    // Pagination 
    const limitVal = parseInt(limit);
    const offsetVal = (parseInt(page) - 1) * limitVal;
    itemQuery += ` LIMIT $${pIdx++} OFFSET $${pIdx++}`;
    params.push(limitVal, offsetVal);

    const itemRes = await db.query(itemQuery, params);
    const items = itemRes.rows;

    // C. Lấy Modifiers
    let modifiers = [];
    if (items.length > 0) {
        const itemIds = items.map(it => `'${it.id}'`).join(',');
        const modQuery = `
            SELECT 
                mimg.menu_item_id,
                mg.id as group_id, mg.name as group_name, mg.selection_type, mg.min_selection, mg.max_selection, mg.is_required,
                mo.id as option_id, mo.name as option_name, mo.price_adjustment, mo.status as option_status
            FROM menu_item_modifier_groups mimg
            JOIN modifier_groups mg ON mimg.modifier_group_id = mg.id
            JOIN modifier_options mo ON mg.id = mo.group_id
            WHERE mimg.menu_item_id IN (${itemIds}) AND mo.status = 'active'
            ORDER BY mimg.sort_order ASC, mo.price_adjustment ASC
        `;
        const modRes = await db.query(modQuery);
        modifiers = modRes.rows;
    }

    // D. Ghép dữ liệu (Stitching)
    items.forEach(item => {
        const myMods = modifiers.filter(m => m.menu_item_id === item.id);
        const groupsMap = {};
        myMods.forEach(row => {
            if (!groupsMap[row.group_id]) {
                groupsMap[row.group_id] = {
                    id: row.group_id, name: row.group_name, 
                    selection_type: row.selection_type, is_required: row.is_required,
                    min_selection: row.min_selection, max_selection: row.max_selection,
                    options: []
                };
            }
            if (row.option_id) {
                groupsMap[row.group_id].options.push({
                    id: row.option_id, name: row.option_name, price_adjustment: row.price_adjustment
                });
            }
        });
        item.modifiers = Object.values(groupsMap);
    });

    const result = categories.map(cat => {
        return {
            ...cat,
            items: items.filter(it => it.category_id === cat.id)
        };
    }).filter(cat => cat.items.length > 0);
    
    res.json({
        data: result,
        pagination: { page: parseInt(page), limit: limitVal }
    });

  } catch (err) { next(err); }
});

module.exports = router;