const express = require('express');
const pool = require('../../config/db');
const { requireUserAuth, optionalUserAuth } = require('../../middleware/auth');

const router = express.Router();
const MAX_CONTENT_LEN = 50;
const LIST_LIMIT = 100;
/** 登录用户排序：先拉一批再在内存里拼顺序，避免漏数据 */
const FETCH_CAP = 300;

function mapRow(row) {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
  };
}

function byCreatedDesc(a, b) {
  const ta = new Date(a.created_at).getTime();
  const tb = new Date(b.created_at).getTime();
  return tb - ta;
}

function stripUserId(rows) {
  return rows.map((r) => ({ id: r.id, content: r.content, created_at: r.created_at }));
}

async function queryMessages(userId) {
  if (userId) {
    const [raw] = await pool.query(
      'SELECT id, content, created_at, user_id FROM messages ORDER BY created_at DESC LIMIT ?',
      [FETCH_CAP]
    );
    const mine = raw.filter((r) => Number(r.user_id) === Number(userId)).sort(byCreatedDesc);
    const others = raw.filter((r) => Number(r.user_id) !== Number(userId)).sort(byCreatedDesc);

    let merged;
    if (others.length === 0) {
      merged = mine;
    } else {
      // 第 1 条：他人最新一条；第 2 条起：自己的全部（新→旧）；再接其余他人
      merged = [others[0], ...mine, ...others.slice(1)];
    }
    return stripUserId(merged.slice(0, LIST_LIMIT));
  }

  const [rows] = await pool.query(
    'SELECT id, content, created_at FROM messages ORDER BY created_at DESC LIMIT ?',
    [LIST_LIMIT]
  );
  return rows;
}

router.get('/', optionalUserAuth, async (req, res) => {
  try {
    const userId = req.auth && req.auth.userId;
    const rows = await queryMessages(userId);
    res.json({ code: 200, data: rows.map(mapRow) });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

router.post('/', requireUserAuth, async (req, res) => {
  try {
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      return res.status(400).json({ code: 400, message: '留言内容不能为空' });
    }
    if (content.length > MAX_CONTENT_LEN) {
      return res.status(400).json({ code: 400, message: `留言最多${MAX_CONTENT_LEN}字` });
    }

    const userId = req.auth.userId;
    const [result] = await pool.query(
      'INSERT INTO messages (user_id, content) VALUES (?, ?)',
      [userId, content]
    );

    const [rows] = await pool.query(
      'SELECT id, content, created_at FROM messages WHERE id = ?',
      [result.insertId]
    );

    res.json({
      code: 200,
      message: '发布成功',
      data: mapRow(rows[0]),
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
