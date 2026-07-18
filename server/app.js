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

// 创建 HTTPS 服务器（若端口被占用或证书缺失则跳过）
try {
  const sslDir = path.join(__dirname, "sdk");
  const keyPath = path.join(sslDir, "huipingzhiyou.cn.key");
  const certPath = path.join(sslDir, "huipingzhiyou.cn_bundle.pem");
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    const httpsServer = https.createServer(options, app);
    httpsServer.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log("⚠ HTTPS 端口 443 已被占用，跳过");
      } else {
        console.error("❌ HTTPS 启动失败:", err.message);
      }
    });
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS 服务器已启动: https://localhost:${HTTPS_PORT}`);
      console.log(
        `📂 图片资源地址: https://localhost:${HTTPS_PORT}/img/文件名`,
      );
    });
  } else {
    console.log("⚠ SSL 证书文件不存在，跳过 HTTPS");
  }
} catch (err) {
  console.log("⚠ HTTPS 启动失败:", err.message);
}

// 可选：保留原来的 HTTP 服务器（用于重定向或内部测试）
// 注意：如果不想保留，可以注释掉下面这段
const http = require("http");
http.createServer(app).listen(HTTP_PORT, () => {
  console.log(`🚀 HTTP 服务器已启动: http://localhost:${HTTP_PORT}`);
});
