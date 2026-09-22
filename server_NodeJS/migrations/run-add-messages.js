/**
 * 执行 migrations/add-messages.sql，为已有库创建 messages 表
 */
const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function main() {
  const sqlPath = path.join(__dirname, "add-messages.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--"));

  for (const stmt of statements) {
    await pool.query(stmt);
  }
  console.log("✅ messages 表迁移完成");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ 迁移失败:", e.message);
  process.exit(1);
});
