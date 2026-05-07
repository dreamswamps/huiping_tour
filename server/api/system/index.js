const express = require('express');
const pool = require('../../config/db');

const router = express.Router();

router.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ code: 200, message: '数据库连接正常', data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

module.exports = router;
