const mysql = require("mysql2/promise");
require("dotenv").config();

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    charset: "utf8mb4",
  });

  const [tables] = await conn.query("SHOW TABLES");
  for (const t of tables) {
    const tbl = Object.values(t)[0];
    const [cols] = await conn.query("SHOW COLUMNS FROM `" + tbl + "`");
    for (const c of cols) {
      const type = c.Type.toLowerCase();
      if (
        type.includes("varchar") ||
        type.includes("text") ||
        type.includes("char")
      ) {
        try {
          const [rows] = await conn.query(
            "SELECT `" +
              c.Field +
              "` FROM `" +
              tbl +
              "` WHERE `" +
              c.Field +
              "` LIKE '%http%' LIMIT 3",
          );
          for (const r of rows) {
            const val = String(r[c.Field]);
            if (val.startsWith("http")) {
              console.log(tbl + "." + c.Field + " = " + val.substring(0, 200));
            }
          }
        } catch (e) {
          // skip
        }
      }
    }
  }
  await conn.end();
  console.log("---DONE---");
})();
