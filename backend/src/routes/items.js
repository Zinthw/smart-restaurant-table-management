const express = require("express");
const db = require("../db");
const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const {
      categoryId,
      category_id,
      q,
      search,
      status,
      sort_by = "created_at",
      order = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const filterCat = categoryId || category_id;
    const filterSearch = q || search;

    let query = `
      SELECT i.*,
             c.name as category_name,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', p.id,
                   'url', p.photo_url,
                   'is_primary', p.is_primary
                 )
               ) FILTER (WHERE p.id IS NOT NULL),
               '[]'
             ) as photos
      FROM menu_items i
      LEFT JOIN menu_categories c ON i.category_id = c.id
      LEFT JOIN menu_item_photos p ON p.menu_item_id = i.id
      WHERE i.deleted_at IS NULL
    `;
    const params = [];
    let paramIdx = 1;

    if (filterCat) {
      query += ` AND i.category_id = $${paramIdx++}`;
      params.push(filterCat);
    }
    if (filterSearch) {
      query += ` AND i.name ILIKE $${paramIdx++}`;
      params.push(`%${filterSearch}%`);
    }
    if (status) {
      query += ` AND i.status = $${paramIdx++}`;
      params.push(status);
    }

    const validSorts = ["price", "name", "created_at"];
    const sortCol = validSorts.includes(sort_by)
      ? `i.${sort_by}`
      : "i.created_at";
    const sortDir = order === "asc" ? "ASC" : "DESC";
    query += ` GROUP BY i.id, c.name ORDER BY ${sortCol} ${sortDir}`;

    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
    params.push(limit, offset);

    const { rows } = await db.query(query, params);

    const countRes = await db.query(
      "SELECT COUNT(*) FROM menu_items WHERE deleted_at IS NULL"
    );

    res.json({
      data: rows,
      pagination: {
        total: parseInt(countRes.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT i.*, c.name as category_name 
       FROM menu_items i
       LEFT JOIN menu_categories c ON i.category_id = c.id
       WHERE i.id = $1 AND i.deleted_at IS NULL`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Item not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { category_id, name, description, price, status } = req.body;

    if (!name || name.trim().length === 0)
      return res.status(400).json({ message: "Item name is required" });
    if (!category_id)
      return res.status(400).json({ message: "Category ID is required" });
    if (price === undefined || price <= 0)
      return res.status(400).json({ message: "Price must be greater than 0" });

    const catCheck = await db.query(
      "SELECT 1 FROM menu_categories WHERE id = $1",
      [category_id]
    );
    if (catCheck.rowCount === 0)
      return res.status(400).json({ message: "Category not found" });

    const { rows } = await db.query(
      `INSERT INTO menu_items (category_id, name, description, price, status)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [category_id, name, description, price, status || "available"]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { category_id, name, description, price, status } = req.body;

    if (!name || name.trim().length === 0)
      return res.status(400).json({ message: "Item name is required" });
    if (price !== undefined && price <= 0)
      return res.status(400).json({ message: "Price must be greater than 0" });
    if (category_id) {
      const catCheck = await db.query(
        "SELECT 1 FROM menu_categories WHERE id = $1",
        [category_id]
      );
      if (catCheck.rowCount === 0)
        return res.status(400).json({ message: "Category not found" });
    }

    const { rows } = await db.query(
      `UPDATE menu_items 
       SET category_id = $1, name = $2, description = $3, price = $4, status = $5, updated_at = NOW()
       WHERE id = $6 AND deleted_at IS NULL RETURNING *`,
      [category_id, name, description, price, status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Item not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "UPDATE menu_items SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ message: "Item not found" });
    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
