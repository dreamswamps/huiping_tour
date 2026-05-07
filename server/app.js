const path = require('path');
const dotenv = require('dotenv');

// 先读 server/.env，再读项目根目录 .env（任选其一即可）
// override: true — 若系统里已有空的 WX_MINI_SECRET，仍会以 .env 里的值为准
dotenv.config({ path: path.join(__dirname, '.env'), override: true });
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const express = require('express');
const cors = require('cors');
const apiRouter = require('./api');

const app = express();
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
  console.log(`📂 图片资源地址: http://localhost:${PORT}/img/文件名`);
});
