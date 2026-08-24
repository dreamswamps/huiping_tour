const path = require("path");
const fs = require("fs"); // 新增：读取证书文件
const https = require("https"); // 新增：HTTPS 模块
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, ".env"), override: true });
dotenv.config({ path: path.join(__dirname, "..", ".env"), override: true });

const express = require("express");
const cors = require("cors");
const apiRouter = require("./api");

const app = express();
const HTTP_PORT = process.env.PORT || 3000; // 原 HTTP 端口，保留备用
const HTTPS_PORT = 443; // HTTPS 标准端口

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/img", express.static(path.join(__dirname, "img")));
// OSS bucket 私有化后的兼容映射：/img/svgs/svgs/ → /img/svgs/
app.use("/img/svgs/svgs", express.static(path.join(__dirname, "img", "svgs")));
// 兼容 OSS 根目录图片：/img/station1.png 等也可通过 /station1.png 访问
app.use(express.static(path.join(__dirname, "img")));

app.get("/", (req, res) => {
  res.json({
    code: 200,
    message: "红旅薪传后端服务运行中",
    timestamp: new Date().toLocaleString(),
  });
});

app.use("/api", apiRouter);

// HTTPS 由前端 Nginx 负责（证书在 /etc/nginx/ssl），后端不再自建 HTTPS 监听。
// 避免旧证书（server/sdk/*.key）抢占 443 导致线上证书错误。
// 如确需后端直连 HTTPS，可在 Nginx 前配置或单独部署。
console.log("ℹ HTTPS 由 Nginx 反向代理终止，后端仅监听 HTTP");

// 可选：保留原来的 HTTP 服务器（用于重定向或内部测试）
// 注意：如果不想保留，可以注释掉下面这段
const http = require("http");
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP 服务器已启动: http://localhost:${HTTP_PORT}`);
});
