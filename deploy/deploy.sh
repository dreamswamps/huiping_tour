#!/usr/bin/env bash
# ============================================================
#  红旅薪传 HPT — 阿里云服务器一键部署脚本
#
#  适用系统：Ubuntu 22.04 / 24.04（阿里云默认镜像）
#  用法：
#     1. 把本脚本所在整个 deploy/ 目录上传到服务器（或用下面第4步在服务器上 git clone）
#     2. sudo bash deploy.sh
#
#  部署内容：
#     - 安装 Node.js 20 / MySQL 8 / Nginx / PM2
#     - 创建数据库 hpt 并导入 sql/hpt.sql
#     - 把代码部署到 /var/www/huiping_tour
#     - 配置 Nginx（HTTP 80 跳转 HTTPS 443 + 反向代理 3000）
#     - 用 PM2 守护后端进程，开机自启
#
#  注意：必须用 root 或 sudo 运行；建议在服务器上重新修改 .env 里的密码
# ============================================================
set -euo pipefail

# ---------- 需要你改的配置 ----------
DOMAIN="huipingzhiyou.cn"              # 你的域名
APP_DIR="/var/www/huiping_tour"        # 代码部署目录
GIT_REPO="https://gitee.com/redteaball/huiping_tour.git"
DB_NAME="hpt"
DB_USER="hpt"
DB_PASS="Hpt@ChangeMe2026"             # ← 改成一个强密码
WX_SECRET="your_app_secret_here"               # ← 改成你微信小程序的 AppSecret
JWT_SECRET="hpt-prod-$(openssl rand -hex 16)" # 随机生成，无需改
# -----------------------------------

log()  { echo -e "\n\033[1;32m▶▶ $*\033[0m"; }
info() { echo -e "    \033[0;36m$*\033[0m"; }
die()  { echo -e "\033[1;31m✗ $*\033[0m" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "请用 sudo 运行: sudo bash deploy.sh"

export DEBIAN_FRONTEND=noninteractive

# ============================================================
log "1/8  更新系统并安装基础工具"
# ============================================================
apt-get update -y
apt-get install -y curl wget git openssl ca-certificates software-properties-common

# ============================================================
log "2/8  安装 Node.js 20"
# ============================================================
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
info "Node $(node -v) / npm $(npm -v)"

# ============================================================
log "3/8  安装 MySQL 8 并启动"
# ============================================================
if ! command -v mysql &>/dev/null; then
  apt-get install -y mysql-server
fi
systemctl enable mysql && systemctl start mysql
info "MySQL 版本: $(mysql --version)"

# ============================================================
log "4/8  拉取代码到 $APP_DIR"
# ============================================================
if [[ ! -d "$APP_DIR/.git" ]]; then
  mkdir -p "$APP_DIR"
  git clone "$GIT_REPO" "$APP_DIR"
else
  cd "$APP_DIR" && git pull
fi
cd "$APP_DIR"

# ============================================================
log "5/8  创建数据库 $DB_NAME 并导入数据"
# ============================================================
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON \`$DB_NAME\`.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
SQL
# 导入完整数据（hpt.sql 在 git 里，clone 后自带）
if [[ -f sql/hpt.sql ]]; then
  mysql -u root "$DB_NAME" < sql/hpt.sql
  info "已导入 sql/hpt.sql"
else
  info "未找到 sql/hpt.sql，跳过（可后续手工导入）"
fi

# ============================================================
log "6/8  配置后端 .env 并安装依赖"
# ============================================================
cat > server/.env <<EOF
WX_MINI_APPID=wx3f0567dc86f7ca12
WX_MINI_SECRET=$WX_SECRET

JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=30d

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DB_NAME=$DB_NAME

PORT=3000
EOF
chmod 600 server/.env
cd server
npm install --production 2>&1 | tail -3
cd ..

# ============================================================
log "7/8  配置 Nginx（HTTP → HTTPS 跳转 + 反向代理）"
# ============================================================
# 使用项目里已有的证书（server/sdk/huipingzhiyou.cn.*）
SSL_DIR=/etc/nginx/ssl
mkdir -p "$SSL_DIR"
if [[ -f server/sdk/$DOMAIN.key && -f server/sdk/${DOMAIN}_bundle.pem ]]; then
  cp server/sdk/$DOMAIN.key "$SSL_DIR/$DOMAIN.key"
  cp server/sdk/${DOMAIN}_bundle.pem "$SSL_DIR/${DOMAIN}_bundle.pem"
  chmod 600 "$SSL_DIR/$DOMAIN.key"
  info "已安装 SSL 证书"
else
  info "⚠ 未找到 $DOMAIN 的证书，Nginx 将只监听 80（证书过期后需重新上传）"
fi

apt-get install -y nginx
cat > /etc/nginx/sites-available/hpt <<'NGINX'
server {
    listen 80;
    server_name huipingzhiyou.cn www.huipingzhiyou.cn;
    return 301 https://$host$request_uri;
}
NGINX

if [[ -f /etc/nginx/ssl/huipingzhiyou.cn.key ]]; then
  cat > /etc/nginx/sites-available/hpt <<NGINX
server {
    listen 443 ssl;
    http2 on;
    server_name huipingzhiyou.cn www.huipingzhiyou.cn;

    ssl_certificate     /etc/nginx/ssl/huipingzhiyou.cn_bundle.pem;
    ssl_certificate_key /etc/nginx/ssl/huipingzhiyou.cn.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 大文件/图片上传限制
    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX
fi

ln -sf /etc/nginx/sites-available/hpt /etc/nginx/sites-enabled/hpt
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable nginx && systemctl restart nginx
info "Nginx 已启动"

# ============================================================
log "8/8  安装 PM2 并启动后端服务"
# ============================================================
npm install -g pm2
cd "$APP_DIR/server"
pm2 delete hpt-server 2>/dev/null || true
pm2 start app.js --name hpt-server
pm2 save
pm2 startup systemd -u root --hp /root &>/dev/null || true
systemctl enable pm2-root 2>/dev/null || true

# ============================================================
log "✅ 部署完成！"
# ============================================================
info "后端服务:    http://127.0.0.1:3000"
info "健康检查:    curl -k https://$DOMAIN/"
info ""
info "接下来需要做的："
info "  1. 改小程序 miniprogram/config.js 的 baseUrl 为 https://$DOMAIN"
info "  2. 微信公众平台 → 开发管理 → 服务器域名，把 https://$DOMAIN 加入 request 合法域名"
info "  3. 用微信开发者工具上传小程序代码并提交审核"
info ""
info "验证服务:"
curl -s http://127.0.0.1:3000/ && echo "" || true
curl -sk https://$DOMAIN/ && echo "" || true
