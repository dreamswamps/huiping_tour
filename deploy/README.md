# 红旅薪传 · 阿里云部署指南

> 一键部署到阿里云服务器。适用 Ubuntu 22.04/24.04，微信小程序强制要求 **HTTPS + 域名已备案**。

---

## 一、买服务器（阿里云）

| 项     | 建议                                                                               |
| ------ | ---------------------------------------------------------------------------------- |
| 规格   | 2核2G 起步，按量/包年均可                                                          |
| 系统   | **Ubuntu 22.04 或 24.04**（64位）                                                  |
| 地域   | 华北2（北京）——和你的 OSS 同区，内网互通                                           |
| 带宽   | 按使用流量 5Mbps 即可                                                              |
| 安全组 | **必须放行**：`22`(SSH)、`80`(HTTP)、`443`(HTTPS)、`3306`(MySQL，可仅对白名单开放) |

> ⚠️ 国内服务器（阿里云）**必须 ICP 备案**，否则 80/443 被拦截，小程序也无法用你的域名。备案约 1~3 周，**建议现在就办**（阿里云控制台 → 备案）。

---

## 二、域名解析

在阿里云「域名控制台」把域名解析到你服务器：

| 记录类型 | 主机记录 | 记录值        |
| -------- | -------- | ------------- |
| A        | `@`      | 服务器公网 IP |
| A        | `www`    | 服务器公网 IP |

---

## 三、一键部署

本目录 3 个文件，任选一种方式弄到服务器上：

**方式 A（推荐）：直接把 `deploy/` 目录里的 `deploy.sh` 用记事本打开 → 修改 `DOMAIN` 和 `DB_PASS` → 上传**，然后：

```bash
# 用你的服务器密码登录
ssh root@你的公网IP

# 上传 deploy.sh 后执行（或直接粘贴下面整段）
sudo bash deploy.sh
```

**方式 B：在服务器上拉取整个仓库再跑脚本**

```bash
ssh root@你的公网IP
apt-get update && apt-get install -y git
git clone https://gitee.com/redteaball/huiping_tour.git /var/www/huiping_tour
cd /var/www/huiping_tour/deploy
# 编辑脚本，改 DOMAIN 和 DB_PASS
nano deploy.sh
sudo bash deploy.sh
```

### 脚本会帮你做的事

1. 安装 Node.js 20、MySQL 8、Nginx、PM2
2. 建库 `hpt` + 建用户 + 导入 `sql/hpt.sql`
3. 生成 `server/.env`（数据库/微信密钥）
4. 安装后端依赖
5. 自动用项目自带证书 `server/sdk/huipingzhiyou.cn.*` 配置 Nginx HTTPS（80 → 443 跳转）
6. PM2 启动后端，开机自启

> ⚠️ **证书会过期**。阿里云有免费证书（有效期1年），到期后：
>
> 1. 阿里云控制台申请新证书并下载 **Nginx 版**
> 2. 上传替换到 `/etc/nginx/ssl/huipingzhiyou.cn_bundle.pem` 和 `.key`
> 3. `nginx -t && systemctl reload nginx`

---

## 四、部署后的 3 件必做

### 1. 修数据里的旧图片地址（重要）

导入的数据里商品图还是老地址，**在你本机**执行下面的 SQL 连接远程库，或直接在服务器上：

```bash
mysql -u hpt -p hpt < /var/www/huiping_tour/deploy/fix-image-urls.sql
```

### 2. 改小程序前端地址

打开 `miniprogram/config.js`：

```javascript
baseUrl: "https://huipingzhiyou.cn",   // ← 改成你的域名
```

### 3. 微信公众平台配置合法域名

登录 [mp.weixin.qq.com](https://mp.weixin.qq.com) → 「开发管理」→「开发设置」→「服务器域名」：

- **request 合法域名**：`https://huipingzhiyou.cn`

---

## 五、发布小程序

1. 微信开发者工具打开 `miniprogram/` 目录
2. 右上角「详情」→ 域名信息 → 勾选「不校验合法域名」（仅调试）
3. 点「上传」→ 填版本号备注
4. 到微信公众平台 → 「版本管理」→ 提交审核 → 通过后「全量发布」

---

## 六、常用运维命令

```bash
pm2 status                    # 看后端进程状态
pm2 logs hpt-server           # 看日志
pm2 restart hpt-server        # 重启
nginx -t && systemctl reload nginx   # 重载 nginx
mysql -u hpt -p               # 进数据库
```

---

## 常见问题

| 现象                              | 原因 / 解决                                     |
| --------------------------------- | ----------------------------------------------- |
| 小程序请求报 `not in domain list` | 没在公众平台配置 request 合法域名，或域名没备案 |
| 手机访问 `http://域名` 打不开     | 80 被安全组拦截 / 域名没备案 / 没解析 A 记录    |
| 商品图 404                        | 忘了执行 `fix-image-urls.sql`，或文件名大小写   |
| 证书报错                          | 证书和域名不匹配，或证书过期，重新申请上传      |
