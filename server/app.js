const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== 中间件 ==========
app.use(cors()); // 允许跨域（小程序请求需要）
app.use(express.json()); // 解析 JSON 请求体

// ========== 静态图片资源服务 ==========
app.use('/img', express.static(path.join(__dirname, 'img')));

// ========== API 路由 ==========

// 健康检查
app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '红旅薪传后端服务运行中',
    timestamp: new Date().toLocaleString()
  });
});

// 获取图片列表
app.get('/api/images', (req, res) => {
  const fs = require('fs');
  const imgDir = path.join(__dirname, 'img');
  
  fs.readdir(imgDir, (err, files) => {
    if (err) {
      return res.status(500).json({ code: 500, message: '读取图片目录失败' });
    }
    const imageList = files.map(f => ({
      name: f,
      url: `/img/${f}`
    }));
    res.json({ code: 200, data: imageList });
  });
});

// 数据库测试接口
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test');
    res.json({ code: 200, message: '数据库连接正常', data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 查询所有景点（示例，根据实际表结构调整）
app.get('/api/spots', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM spots ORDER BY id DESC');
    res.json({ code: 200, data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 查询商品列表（商城）
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json({ code: 200, data: rows });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// 用户相关（示例）
app.get('/api/user/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nickname, avatar, score FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

// ========== 启动服务 ==========
app.listen(PORT, () => {
  console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
  console.log(`📂 图片资源地址: http://localhost:${PORT}/img/文件名`);
});
