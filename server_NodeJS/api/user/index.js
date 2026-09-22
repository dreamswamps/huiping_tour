const express = require("express");
const pool = require("../../config/db");
const { requireUserAuth } = require("../../middleware/auth");
const { register: registerAddressRoutes } = require("./addresses");

const router = express.Router();

registerAddressRoutes(router, requireUserAuth);

// 获取当前用户信息
router.get("/profile", requireUserAuth, async (req, res) => {
  const userId = req.auth && req.auth.userId;
  if (!userId) {
    return res.status(401).json({ code: 401, message: "未授权" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, nickname, avatar, score, created_at FROM users WHERE id = ?",
      [userId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: "用户不存在" });
    }
    res.json({ code: 200, message: "获取成功", data: rows[0] });
  } catch (error) {
    console.error("获取用户信息失败:", error.message);
    res.status(500).json({ code: 500, message: "服务器错误" });
  }
});

// 更新当前用户信息
router.put("/profile", requireUserAuth, async (req, res) => {
  const userId = req.auth && req.auth.userId;
  if (!userId) {
    return res.status(401).json({ code: 401, message: "未授权" });
  }

  const { nickname, avatar } = req.body || {};

  const updates = [];
  const values = [];

  if (typeof nickname === "string" && nickname.trim()) {
    updates.push("nickname = ?");
    values.push(nickname.trim().slice(0, 100));
  }
  if (typeof avatar === "string") {
    updates.push("avatar = ?");
    values.push(avatar.slice(0, 512));
  }

  if (updates.length === 0) {
    return res.status(400).json({ code: 400, message: "没有需要更新的字段" });
  }

  values.push(userId);

  try {
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );
    const [rows] = await pool.query(
      "SELECT id, nickname, avatar, score, created_at FROM users WHERE id = ?",
      [userId],
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: "用户不存在" });
    }
    res.json({ code: 200, message: "更新成功", data: rows[0] });
  } catch (error) {
    console.error("更新用户资料失败:", error.message);
    res.status(500).json({ code: 500, message: "服务器错误" });
  }
});

module.exports = router;
