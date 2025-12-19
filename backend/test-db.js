require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("Testing database connection...");
console.log("DATABASE_URL:", process.env.DATABASE_URL);

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ Database connection FAILED:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Database connection SUCCESS!");
    console.log("Current time from DB:", res.rows[0].now);
    pool.end();
    process.exit(0);
  }
});
