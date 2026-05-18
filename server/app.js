const path = require('path');
const fs = require('fs');          // 新增：读取证书文件
const https = require('https');    // 新增：HTTPS 模块
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;      // 原 HTTP 端口，保留备用
const HTTPS_PORT = 443;                          // HTTPS 标准端口

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/img', express.static(path.join(__dirname, 'img')));

app.get('/', (req, res) => {
  res.json({
    code: 200,
    message: '红旅薪传后端服务运行中',
    timestamp: new Date().toLocaleString(),
  });
});

app.use('/api', apiRouter);

// -------- 读取 SSL 证书（请确认路径正确）--------
// 你的证书放在 server/sdk/ 目录下
const sslDir = path.join(__dirname, 'sdk');
const options = {
  key: fs.readFileSync(path.join(sslDir, 'huipingzhiyou.cn.key')),
  cert: fs.readFileSync(path.join(sslDir, 'huipingzhiyou.cn_bundle.pem'))
};

// 创建 HTTPS 服务器
https.createServer(options, app).listen(HTTPS_PORT, () => {
  console.log(`🔒 HTTPS 服务器已启动: https://localhost:${HTTPS_PORT}`);
  console.log(`📂 图片资源地址: https://localhost:${HTTPS_PORT}/img/文件名`);
});

// 可选：保留原来的 HTTP 服务器（用于重定向或内部测试）
// 注意：如果不想保留，可以注释掉下面这段
const http = require('http');
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP 服务器已启动: http://localhost:${HTTP_PORT}`);
});