const path = require("path");
const mysql = require("mysql2/promise");

// 允许只 require 本文件时也能读到 server/.env（与 app.js 一致）
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});
require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
  override: true,
});

// 数据库连接配置（优先环境变量，便于本机 / 服务器切换）
const dbConfig = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password:
    process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD) : "",
  database: process.env.DB_NAME || "hpt",
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 每个新连接显式声明客户端字符集，避免中文在部分环境下变成问号
pool.on("connection", (connection) => {
  connection.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
});

// 测试数据库连接
pool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL 数据库连接成功");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL 数据库连接失败:", err.message);
  });

module.exports = pool;
