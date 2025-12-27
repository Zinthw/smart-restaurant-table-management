const express = require("express");
const db = require("../db");
const fs = require("fs");
const path = require("path");
const upload = require("../middleware/uploadMiddleware");
const router = express.Router();

// POST URL-based photo (từ link internet) - phải đặt TRƯỚC /:id/photos
router.post("/:id/photos/from-url", async (req, res, next) => {
  try {
    const itemId = req.params.id;
    const { urls } = req.body; // Array of photo URLs

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: "Please provide photo URLs" });
    }

    const itemCheck = await db.query("SELECT 1 FROM menu_items WHERE id = $1", [
      itemId,
    ]);
    if (itemCheck.rowCount === 0) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    const insertPromises = urls.map((url) => {
      return db.query(
        `INSERT INTO menu_item_photos (menu_item_id, photo_url) VALUES ($1, $2) RETURNING *`,
        [itemId, url]
      );
    });

    const results = await Promise.all(insertPromises);
    const savedPhotos = results.map((r) => r.rows[0]);

    res
      .status(201)
      .json({ message: "Photos saved successfully", data: savedPhotos });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/photos",
  upload.array("photos", 5),
  async (req, res, next) => {
    try {
      const itemId = req.params.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res
          .status(400)
          .json({ message: "Please select at least one photo" });
      }

      const itemCheck = await db.query(
        "SELECT 1 FROM menu_items WHERE id = $1",
        [itemId]
      );
      if (itemCheck.rowCount === 0) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      const insertPromises = files.map((file) => {
        const fileUrl = `/uploads/${file.filename}`;
        return db.query(
          `INSERT INTO menu_item_photos (menu_item_id, photo_url) VALUES ($1, $2) RETURNING *`,
          [itemId, fileUrl]
        );
      });

      const results = await Promise.all(insertPromises);
      const uploadedPhotos = results.map((r) => r.rows[0]);

      res
        .status(201)
        .json({ message: "Upload successful", data: uploadedPhotos });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id/photos/:photoId", async (req, res, next) => {
  try {
    const { id, photoId } = req.params;

    const { rows } = await db.query(
      "SELECT * FROM menu_item_photos WHERE id = $1 AND menu_item_id = $2",
      [photoId, id]
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ message: "Photo not found or does not belong to this item" });

    const photo = rows[0];

    await db.query("DELETE FROM menu_item_photos WHERE id = $1", [photoId]);

    const filePath = path.join(__dirname, "../../", photo.photo_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Photo deleted successfully" });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/photos/:photoId/primary", async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query("BEGIN");
    const { id, photoId } = req.params;

    // Validate ảnh thuộc item
    const photoRes = await client.query(
      "SELECT 1 FROM menu_item_photos WHERE id = $1 AND menu_item_id = $2",
      [photoId, id]
    );
    if (photoRes.rowCount === 0) throw new Error("Invalid photo");

    await client.query(
      "UPDATE menu_item_photos SET is_primary = false WHERE menu_item_id = $1",
      [id]
    );

    await client.query(
      "UPDATE menu_item_photos SET is_primary = true WHERE id = $1",
      [photoId]
    );

    await client.query("COMMIT");
    res.json({ message: "Primary photo updated successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ message: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
