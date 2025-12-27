const express = require("express");
const cors = require("cors");
require("dotenv").config();

const tablesRouter = require("./routes/tables");
const qrRouter = require("./routes/qr");
const publicRouter = require("./routes/public");
const errorHandler = require("./middleware/errorHandler");

const authRouter = require("./routes/auth");
const { requireAuth, requireRole } = require("./middleware/authMiddleware");

const categoriesRouter = require("./routes/categories");
const itemsRouter = require("./routes/items");
const path = require("path");
const photosRouter = require("./routes/photos");
const modifiersRouter = require("./routes/modifiers");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Giúp truy cập ảnh qua link
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// API Auth (Login/Register)
app.use("/api/auth", authRouter);

// API Admin (Tables, QR)
app.use("/api/admin/tables", requireAuth, requireRole("admin"), tablesRouter);
app.use("/api/admin/tables", requireAuth, requireRole("admin"), qrRouter);

// MENU MANAGEMENT ROUTES
app.use(
  "/api/admin/menu/categories",
  requireAuth,
  requireRole("admin"),
  categoriesRouter
);

// Router Photos - Mount TRƯỚC itemsRouter để cụ thể routes match trước
app.use(
  "/api/admin/menu/items",
  requireAuth,
  requireRole("admin"),
  photosRouter
);

// Router Items - Mount sau photos
app.use(
  "/api/admin/menu/items",
  requireAuth,
  requireRole("admin"),
  itemsRouter
);

// Router Modifiers
app.use("/api/admin/menu", requireAuth, requireRole("admin"), modifiersRouter);

// Public Routes (Dành cho khách quét QR)
app.use("/api/menu", publicRouter);

app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
