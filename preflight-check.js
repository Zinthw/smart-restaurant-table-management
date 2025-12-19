#!/usr/bin/env node

/**
 * Pre-flight check script
 * Kiểm tra các yêu cầu môi trường trước khi chạy app
 */

const fs = require("fs");
const path = require("path");

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

console.log("🚀 Smart Restaurant - Pre-flight Check\n");

// Check 1: Node version
console.log("1️⃣  Checking Node.js version...");
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split(".")[0]);
if (majorVersion >= 18) {
  console.log(`   ✅ Node.js ${nodeVersion} (OK)\n`);
  checks.passed++;
} else {
  console.log(`   ❌ Node.js ${nodeVersion} (Required: >= 18.x)\n`);
  checks.failed++;
}

// Check 2: Backend .env file
console.log("2️⃣  Checking backend .env file...");
const backendEnvPath = path.join(__dirname, "backend", ".env");
if (fs.existsSync(backendEnvPath)) {
  const envContent = fs.readFileSync(backendEnvPath, "utf-8");

  const requiredVars = ["DATABASE_URL", "QR_JWT_SECRET", "CLIENT_BASE_URL"];
  const missingVars = requiredVars.filter((v) => !envContent.includes(v));

  if (missingVars.length === 0) {
    console.log("   ✅ Backend .env exists with required variables\n");
    checks.passed++;
  } else {
    console.log(`   ⚠️  Backend .env missing: ${missingVars.join(", ")}\n`);
    checks.warnings++;
  }
} else {
  console.log("   ❌ Backend .env not found (copy from .env.example)\n");
  checks.failed++;
}

// Check 3: Frontend .env file
console.log("3️⃣  Checking frontend .env file...");
const frontendEnvPath = path.join(__dirname, "frontend", ".env");
if (fs.existsSync(frontendEnvPath)) {
  const envContent = fs.readFileSync(frontendEnvPath, "utf-8");

  if (envContent.includes("VITE_API_URL")) {
    console.log("   ✅ Frontend .env exists with VITE_API_URL\n");
    checks.passed++;
  } else {
    console.log("   ⚠️  Frontend .env missing VITE_API_URL\n");
    checks.warnings++;
  }
} else {
  console.log("   ❌ Frontend .env not found (copy from .env.example)\n");
  checks.failed++;
}

// Check 4: Backend node_modules
console.log("4️⃣  Checking backend dependencies...");
if (fs.existsSync(path.join(__dirname, "backend", "node_modules"))) {
  console.log("   ✅ Backend dependencies installed\n");
  checks.passed++;
} else {
  console.log(
    "   ❌ Backend dependencies not installed (run: cd backend && npm install)\n"
  );
  checks.failed++;
}

// Check 5: Frontend node_modules
console.log("5️⃣  Checking frontend dependencies...");
if (fs.existsSync(path.join(__dirname, "frontend", "node_modules"))) {
  console.log("   ✅ Frontend dependencies installed\n");
  checks.passed++;
} else {
  console.log(
    "   ❌ Frontend dependencies not installed (run: cd frontend && npm install)\n"
  );
  checks.failed++;
}

// Check 6: Database schema file
console.log("6️⃣  Checking database schema...");
if (fs.existsSync(path.join(__dirname, "backend", "database.sql"))) {
  console.log("   ✅ database.sql found\n");
  checks.passed++;
} else {
  console.log("   ❌ database.sql not found\n");
  checks.failed++;
}

// Summary
console.log("═".repeat(50));
console.log("📊 Summary:");
console.log(`   ✅ Passed: ${checks.passed}`);
console.log(`   ⚠️  Warnings: ${checks.warnings}`);
console.log(`   ❌ Failed: ${checks.failed}`);
console.log("═".repeat(50));

if (checks.failed > 0) {
  console.log("\n❌ Pre-flight check FAILED. Please fix the issues above.\n");
  process.exit(1);
} else if (checks.warnings > 0) {
  console.log(
    "\n⚠️  Pre-flight check passed with WARNINGS. Review the warnings above.\n"
  );
  process.exit(0);
} else {
  console.log("\n✅ All checks PASSED! Ready to run.\n");
  console.log("Run: npm run dev\n");
  process.exit(0);
}
