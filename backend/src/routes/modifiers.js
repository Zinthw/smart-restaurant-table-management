const express = require("express");
const db = require("../db");
const router = express.Router();

router.post("/modifier-groups", async (req, res, next) => {
  try {
    const { name, selection_type, min_selection, max_selection, required } =
      req.body;

    if (!name)
      return res.status(400).json({ message: "Group name is required" });
    if (selection_type === "multiple") {
      if (min_selection > max_selection) {
        return res.status(400).json({
          message: "Min selection cannot be greater than Max selection",
        });
      }
    }

    const { rows } = await db.query(
      `INSERT INTO modifier_groups (name, selection_type, min_selection, max_selection, is_required) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        name,
        selection_type || "single",
        min_selection || 0,
        max_selection || 1,
        required || false,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/modifier-groups/:id", async (req, res, next) => {
  try {
    const { name, selection_type, min_selection, max_selection, required } =
      req.body;

    if (!name)
      return res.status(400).json({ message: "Group name is required" });
    if (selection_type === "multiple" && min_selection > max_selection) {
      return res.status(400).json({
        message: "Min selection cannot be greater than Max selection",
      });
    }

    const { rows } = await db.query(
      `UPDATE modifier_groups 
       SET name = $1, selection_type = $2, min_selection = $3, max_selection = $4, is_required = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [
        name,
        selection_type,
        min_selection || 0,
        max_selection || 1,
        required || false,
        req.params.id,
      ]
    );

    if (!rows[0]) return res.status(404).json({ message: "Group not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.get("/modifier-groups", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT mg.*,
              COALESCE(json_agg(
                json_build_object(
                  'id', mo.id,
                  'name', mo.name,
                  'price_adjustment', mo.price_adjustment,
                  'status', mo.status
                )
              ) FILTER (WHERE mo.id IS NOT NULL), '[]') AS options
       FROM modifier_groups mg
       LEFT JOIN modifier_options mo ON mo.group_id = mg.id
       GROUP BY mg.id
       ORDER BY mg.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/modifier-groups/:id/options", async (req, res, next) => {
  try {
    const { name, price_adjustment } = req.body;
    const groupId = req.params.id;

    if (!name)
      return res.status(400).json({ message: "Option name is required" });
    if (price_adjustment < 0)
      return res.status(400).json({ message: "Price cannot be negative" });

    const { rows } = await db.query(
      `INSERT INTO modifier_options (group_id, name, price_adjustment) 
       VALUES ($1, $2, $3) RETURNING *`,
      [groupId, name, price_adjustment || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put("/modifier-options/:id", async (req, res, next) => {
  try {
    const { name, price_adjustment, status } = req.body;

    // Validate
    if (!name)
      return res.status(400).json({ message: "Option name is required" });
    if (price_adjustment !== undefined && price_adjustment < 0) {
      return res.status(400).json({ message: "Price cannot be negative" });
    }

    const { rows } = await db.query(
      `UPDATE modifier_options 
       SET name = $1, price_adjustment = $2, status = $3
       WHERE id = $4 RETURNING *`,
      [name, price_adjustment, status || "active", req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "Option not found" });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete("/modifier-groups/:id", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "DELETE FROM modifier_groups WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "Group not found" });
    res.json({ message: "Group deleted successfully", deletedGroup: rows[0] });
  } catch (err) {
    next(err);
  }
});

router.delete("/modifier-options/:id", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      "DELETE FROM modifier_options WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ message: "Option not found" });
    res.json({
      message: "Option deleted successfully",
      deletedOption: rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.post("/items/:id/modifier-groups", async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const itemId = req.params.id;
    const { groupIds } = req.body;

    if (!Array.isArray(groupIds)) throw new Error("groupIds must be an array");

    await client.query(
      "DELETE FROM menu_item_modifier_groups WHERE menu_item_id = $1",
      [itemId]
    );

    if (groupIds.length > 0) {
      for (let i = 0; i < groupIds.length; i++) {
        await client.query(
          `INSERT INTO menu_item_modifier_groups (menu_item_id, modifier_group_id, sort_order) 
                 VALUES ($1, $2, $3)`,
          [itemId, groupIds[i], i]
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Modifiers updated for menu item successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
