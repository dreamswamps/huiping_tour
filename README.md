# HPT - 红旅薪传

> 红色文化旅游微信小程序 —— 传承红色基因，弘扬革命精神

## 项目概览

| 项目         | 说明                                      |
| ------------ | ----------------------------------------- |
| 项目名称     | HPT (红旅薪传)                            |
| 类型         | 微信小程序 + Express 后端 + MySQL         |
| 小程序 AppID | `wx3f0567dc86f7ca12`                      |
| 后端端口     | `3000`                                    |
| 数据库       | MySQL @ `110.40.187.34:3306` / 库名 `hpt` |

---

## 技术栈

```
前端：微信原生框架（WXML / WXSS / JavaScript）
后端：Node.js + Express 4.x
数据库：MySQL 8.x（远程服务器）
ORM/驱动：mysql2（Promise 连接池）
设计工具：Figma + CodeBuddy 插件
版本控制：Git
```

---

## 目录结构

```
HPT/
├── README.md                    # ← 本文件，项目开发文档
├── .gitignore                   # Git 忽略规则（assets/, .codebuddy/）
│
├── miniprogram/                 # 微信小程序前端代码
│   ├── app.js                   # 小程序入口
│   ├── app.json                 # 全局配置（页面路由、窗口样式）
│   ├── app.wxss                 # 全局样式表
│   ├── config.js                # API 地址配置（baseUrl）
│   ├── project.config.json      # 开发者工具配置
│   ├── images/                  # 本地小图标资源 (~15KB)
│   │   ├── 1.svg ~ 15.svg       # 功能图标（TabBar、卡片等）
│   │   ├── ai-circle.svg        # AI 导览圆形图标
│   │   ├── hotspot-title.svg    # 标题装饰
│   │   └── slider1.svg          # 轮播装饰
│   └── pages/
│       ├── index/               # ★ 首页（核心页面，唯一完整实现）
│       │   ├── index.js         # 页面逻辑
│       │   ├── index.json       # 页面配置（自定义导航栏）
│       │   ├── index.wxml       # 页面模板（多Tab切换）
│       │   └── index.wxss       # 页面样式
│       ├── map/                 # 传薪地图页（占位，待开发）
│       ├── mall/                # 商城页（占位，待开发）
│       └── profile/             # 个人中心页（占位，待开发）
│
├── server/                      # 后端服务
│   ├── package.json             # Node.js 依赖配置
│   ├── app.js                   # Express 主服务器（API路由 + 静态资源）
│   ├── config/
│   │   └── db.js                # MySQL 连接池配置
│   ├── init-db.js               # 数据库初始化脚本（Node.js版）
│   ├── init.sql                 # 数据库建表SQL（备用）
│   └── img/                     # 静态图片资源目录
│       ├── 1.svg ~ 19.svg       # 全部图标和图片（含大图）
│       ├── banner1.svg          # 主轮播横幅图
│       ├── ai-circle.svg        # AI 圆形图标
│       ├── hotspot-title.svg    # 标题装饰
│       └── slider1.svg          # 轮播装饰
│
├── assets/                      # 设计资源备份（不入库）
└── .codebuddy/                  # Figma 设计稿导出（不入库）
```

---

## 架构图

```
┌─────────────────────────────────────────────────┐
│            微信小程序前端 (miniprogram)           │
│                                                   │
│  ┌──────┐  ┌────┐  ┌────┐  ┌────────┐          │
│  │首页 ★│  │地图│  │商城│  │我的    │          │
│  │完整  │  │待开发│  │待开发│  │待开发   │          │
│  └──┬───┘  └─┬──┘  └─┬──┘  └───┬────┘          │
│     └─────────┴───────┴──────────┘              │
│                     │ HTTP                       │
├─────────────────────┼───────────────────────────┤
│         后端服务 (server) :port=3000              │
│                     │                           │
│    ┌────────────────▼────────────────┐          │
│    │     Express.js 服务器            │          │
│    │  GET /api/spots    → 景点列表   │          │
│    │  GET /api/products → 商品列表   │          │
│    │  GET /api/user/:id → 用户信息   │          │
│    │  GET /api/images   → 图片列表   │          │
│    │  GET /img/*        → 静态图片   │          │
│    └────────────────┬────────────────┘          │
│              mysql2/promise                      │
│    ┌────────────────▼────────────────┐          │
│    │  MySQL @ 110.40.187.34:3306     │          │
│    │  Database: hpt                   │          │
│    └─────────────────────────────────┘          │
└─────────────────────────────────────────────────┘
```

---

## 数据库结构

数据库名：`hpt`（utf8mb4 编码）

### spots — 景点信息表

| 字段        | 类型                   | 说明                |
| ----------- | ---------------------- | ------------------- |
| id          | INT PK AUTO_INCREMENT  | 主键                |
| title       | VARCHAR(100) NOT NULL  | 景点名称            |
| description | TEXT                   | 景点描述            |
| image       | VARCHAR(255)           | 封面图片路径        |
| category    | VARCHAR(50)            | 分类                |
| location    | VARCHAR(100)           | 地址                |
| latitude    | DECIMAL(10,6)          | 纬度                |
| longitude   | DECIMAL(10,6)          | 经度                |
| status      | TINYINT DEFAULT 1      | 状态：1启用 / 0禁用 |
| created_at  | DATETIME DEFAULT NOW() | 创建时间            |

### products — 商城商品表

| 字段           | 类型                   | 说明                |
| -------------- | ---------------------- | ------------------- |
| id             | INT PK AUTO_INCREMENT  | 主键                |
| name           | VARCHAR(100) NOT NULL  | 商品名称            |
| description    | TEXT                   | 商品描述            |
| price          | DECIMAL(10,2) NOT NULL | 售价                |
| original_price | DECIMAL(10,2)          | 原价                |
| image          | VARCHAR(255)           | 商品图片            |
| stock          | INT DEFAULT 0          | 库存                |
| status         | TINYINT DEFAULT 1      | 状态：1上架 / 0下架 |
| created_at     | DATETIME DEFAULT NOW() | 创建时间            |

### users — 用户表

| 字段       | 类型                        | 说明        |
| ---------- | --------------------------- | ----------- |
| id         | INT PK AUTO_INCREMENT       | 主键        |
| openid     | VARCHAR(64) UNIQUE NOT NULL | 微信 openid |
| nickname   | VARCHAR(50)                 | 昵称        |
| avatar     | VARCHAR(255)                | 头像 URL    |
| score      | INT DEFAULT 0               | 积分        |
| created_at | DATETIME DEFAULT NOW()      | 注册时间    |

### badges — 任务徽章表

| 字段           | 类型                  | 说明         |
| -------------- | --------------------- | ------------ |
| id             | INT PK AUTO_INCREMENT | 主键         |
| name           | VARCHAR(50) NOT NULL  | 徽章名称     |
| icon           | VARCHAR(255)          | 徽章图标路径 |
| description    | VARCHAR(200)          | 描述         |
| condition_text | VARCHAR(100)          | 获取条件说明 |
| sort_order     | INT DEFAULT 0         | 排序权重     |

### 初始示例数据

已预置：

- **景点** ×2：井冈山革命博物馆、南昌起义纪念馆
- **商品** ×2：红色记忆纪念册(¥39.90)、井冈山文创书签(¥19.90)
- **徽章** ×2：红色先锋、薪火传人

---

## API 接口文档

基础地址：`http://<服务器IP>:3000`

### 公共接口

| 方法 | 路径           | 说明             | 返回示例                          |
| ---- | -------------- | ---------------- | --------------------------------- |
| GET  | `/`            | 健康检查         | `{ code:200, message:"..." }`     |
| GET  | `/api/test-db` | 测试数据库连接   | `{ code:200, data:[...] }`        |
| GET  | `/api/images`  | 获取图片资源列表 | `{ code:200, data:[{name,url}] }` |

### 业务接口

| 方法 | 路径            | 说明         | 返回示例                               |
| ---- | --------------- | ------------ | -------------------------------------- |
| GET  | `/api/spots`    | 获取景点列表 | `{ code:200, data:[spots] }`           |
| GET  | `/api/products` | 获取商品列表 | `{ code:200, data:[products] }`        |
| GET  | `/api/user/:id` | 获取用户信息 | `{ code:200, data:{id,nickname,...} }` |

### 静态资源

| 方法 | 路径             | 说明                          |
| ---- | ---------------- | ----------------------------- |
| GET  | `/img/:filename` | 返回 server/img/ 下的图片文件 |

> 所有接口统一返回格式：`{ code: number, message?: string, data?: any }`

---

## 快速开始

### 环境要求

- Node.js >= 16
- MySQL >= 8.0
- 微信开发者工具（最新版）

### 1. 启动后端服务

```bash
cd server
npm install              # 安装依赖（首次）
node init-db.js          # 初始化数据库（首次）
node app.js              # 启动服务
# 或热重载开发模式：
npm run dev
```

启动成功后访问 `http://localhost:3000` 可看到健康检查响应。

### 2. 配置小程序

编辑 `miniprogram/config.js`：

```javascript
module.exports = {
  // 本地开发用 localhost；真机调试改为本机局域网IP或部署后的公网地址
  baseUrl: "http://localhost:3000",
};
```

> **注意**：微信开发者工具中需勾选「不校验合法域名」选项才能请求本地接口。

### 3. 图片资源策略

为避免小程序主包超过 2MB 限制：

- **小图标** (< 5KB)：保留在 `miniprogram/images/` 本地打包
- **大图片** (> 100KB)：存放于 `server/img/`，通过 HTTP 加载
- 前端使用 `{{baseUrl}}/img/xxx.svg` 动态引用网络图片

---

## 各模块开发状态

| 模块         | 完成度 | 当前状态            | 待办事项                             |
| ------------ | ------ | ------------------- | ------------------------------------ |
| **首页**     | 90%    | UI 完整，数据硬编码 | 对接后端 API 动态渲染轮播图/景点列表 |
| **地图页**   | 5%     | 占位文字            | 集成腾讯地图 SDK，展示景点标记       |
| **商城页**   | 5%     | 占位文字            | 商品列表展示，商品详情页             |
| **个人中心** | 5%     | 占位文字            | 微信登录，用户信息展示，徽章墙       |
| **后端 API** | 60%    | 只读接口就绪        | 补充写操作(CRUD)，微信登录鉴权       |
| **数据库**   | 80%    | 表结构+示例数据     | 按业务扩展字段                       |

---

## 开发规范与约定

### 代码风格

```javascript
// 小程序页面标准结构
Page({
  data: {/* ... */},
  onLoad() {
    /* ... */
  },

  // 事件方法：on + 元素功能名
  onFuncCard(e) {
    /* ... */
  },

  // 跳转方法：go + 目标名
  goMap() {
    /* ... */
  },
});
```

### 配色方案

| 用途        | 色值      | 说明                        |
| ----------- | --------- | --------------------------- |
| 主题红      | `#A80101` | 导航栏背景、AI 圆形、选中态 |
| 背景米黄    | `#F8F5F0` | 页面整体底色                |
| TabBar 背景 | `#FEF6F1` | 底部导航浅暖色              |
| 文字主色    | `#333333` | 正文深灰                    |
| 文字辅色    | `#999999` | 描述浅灰                    |

### 关键技术决策

1. **单页面多 Tab 架构**：首页内含 4 个 Tab 区域，非原生 tabBar 跳转，减少包体积和页面跳转开销
2. **自定义导航栏 & TabBar**：`index.json` 中设置 `navigationStyle: custom`，完全自定义顶部导航和底部标签栏
3. **大图外置**：SVG 大图 (>400KB) 通过后端 `/img/*` 静态服务加载，不在小程序包内
4. **数据库连接池**：使用 `mysql2/promise` 连接池管理 MySQL 连接，最大 10 并发

### 注意事项

- 微信小程序对 HTTPS 有严格限制，开发阶段在「项目配置」中关闭域名校验即可使用 HTTP
- 生产环境必须使用 HTTPS 且域名已在微信公众平台备案
- `server/img/` 目录中的 SVG 大图（16~19.svg、banner1.svg）约 454KB/个，疑似包含 base64 位图嵌入，建议后续转为 JPG/PNG 格式优化加载速度

---

## 部署说明

### 本地开发

1. 确保 MySQL 服务运行且可从本机访问
2. `cd server && npm install && node init-db.js`
3. `node app.js` 启动后端
4. 修改 `miniprogram/config.js` 的 `baseUrl`
5. 微信开发者工具打开 `miniprogram/` 目录

### 生产部署（参考）

```bash
# 1. 将 server/ 部署到云服务器
# 2. 使用 PM2 守护进程
pm2 start server/app.js --name hpt-server

# 3. Nginx 反向代理（可选）
# 4. 申请 SSL 证书配置 HTTPS
# 5. 在 miniprogram/config.js 中修改 baseUrl 为生产地址
```
