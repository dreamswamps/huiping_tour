const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('./config/db');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// 微信小程序配置（请替换为你的小程序实际 AppID 和 AppSecret）
const WX_CONFIG = {
  appid: 'wxdf09d26595d7b44f',        // 替换为你的小程序 AppID
  secret: '6447dd283bb6408912dfb19b4cfd1774'    // 替换为你的小程序 AppSecret
};

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

// 微信小程序登录 - 通过 code 换取 openid
app.post('/api/login', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ code: 400, message: '缺少 code 参数' });
  }

  try {
    // 调用微信接口用 code 换取 openid
    const wxApiUrl = `https://api.weixin.qq.com/sns/jscode2session`;
    const wxResponse = await axios.get(wxApiUrl, {
      params: {
        appid: WX_CONFIG.appid,
        secret: WX_CONFIG.secret,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    const { openid, session_key, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      console.error('微信登录失败:', errcode, errmsg);
      return res.status(400).json({ code: 400, message: '微信登录失败', error: errmsg });
    }

    // 记录 openid 日志（实际项目中应存入数据库）
    console.log('用户 openid:', openid);

    // 查找或创建用户（示例逻辑）
    let user = null;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
      if (rows.length > 0) {
        user = rows[0];
      } else {
        // 新用户：插入数据库
        const nickname = '旅行者' + Math.floor(Math.random() * 10000);
        const uid = 'CX' + Date.now().toString().slice(-8);
        await pool.query(
          'INSERT INTO users (openid, nickname, uid, create_time) VALUES (?, ?, ?, NOW())',
          [openid, nickname, uid]
        );
        user = { openid, nickname, uid };
      }
    } catch (dbError) {
      console.error('数据库操作失败:', dbError.message);
      // 数据库出错时仍返回 openid，前端可以继续
    }

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        openid,
        nickname: user?.nickname || '旅行者',
        uid: user?.uid || ''
      }
    });

  } catch (error) {
    console.error('登录接口异常:', error.message);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
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
