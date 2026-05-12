-- 红旅薪传小程序数据库初始化脚本
-- 数据库名: hpt

CREATE DATABASE IF NOT EXISTS hpt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE hpt;

-- ========== 基础表 ==========

-- ========== 景点 ==========
CREATE TABLE IF NOT EXISTS spots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '景点名称',
  description TEXT COMMENT '景点描述',
  image VARCHAR(255) COMMENT '封面图片路径',
  category VARCHAR(50) COMMENT '分类',
  location VARCHAR(100) COMMENT '地址',
  latitude DECIMAL(10, 6) COMMENT '纬度',
  longitude DECIMAL(10, 6) COMMENT '经度',
  status TINYINT DEFAULT 1 COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='景点';

-- ========== 用户（微信 openid 唯一；uid 为业务展示号）==========
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL COMMENT '微信 openid',
  unionid VARCHAR(64) DEFAULT NULL COMMENT '微信 unionid（需绑定开放平台后可用）',
  uid VARCHAR(32) NOT NULL COMMENT '业务 UID，如 CXxxxxxxxx',
  nickname VARCHAR(100) DEFAULT NULL COMMENT '昵称',
  avatar VARCHAR(512) DEFAULT NULL COMMENT '头像 URL',
  score INT DEFAULT 0 COMMENT '积分',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_users_openid (openid),
  UNIQUE KEY uk_users_uid (uid),
  KEY idx_users_unionid (unionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户';

-- ========== 用户收货地址（一对多）==========
CREATE TABLE IF NOT EXISTS user_addresses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '关联 users.id',
  receiver_name VARCHAR(50) NOT NULL COMMENT '收货人',
  receiver_phone VARCHAR(20) NOT NULL COMMENT '手机号',
  province VARCHAR(32) NOT NULL COMMENT '省',
  city VARCHAR(32) NOT NULL COMMENT '市',
  district VARCHAR(32) NOT NULL COMMENT '区/县',
  detail_address VARCHAR(255) NOT NULL COMMENT '详细地址',
  postal_code VARCHAR(10) DEFAULT NULL COMMENT '邮编',
  label VARCHAR(20) DEFAULT NULL COMMENT '标签：家、公司等',
  is_default TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认地址 0/1',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_user_addresses_user (user_id),
  CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户收货地址';

-- ========== 徽章 ==========
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '徽章名称',
  icon VARCHAR(255) COMMENT '徽章图标',
  description VARCHAR(200) COMMENT '描述',
  condition_text VARCHAR(100) COMMENT '获取条件说明',
  sort_order INT DEFAULT 0 COMMENT '排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='徽章';

-- ========== 商城表 ==========

-- ========== 商品（商城列表页展示）==========
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  price DECIMAL(10, 2) NOT NULL COMMENT '售价',
  thumb VARCHAR(255) DEFAULT NULL COMMENT '封面图',
  stock INT DEFAULT 0 COMMENT '库存',
  status TINYINT DEFAULT 1 COMMENT '状态：0下架 1上架',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品';

-- 插入商品数据
INSERT INTO products (name, price, thumb, stock, status) VALUES
('红色主题笔记本', 28.00, 'http://localhost:3000/img/turn-1.jpg', 200, 1),
('薪火相传纪念徽章', 15.00, 'http://localhost:3000/img/turn-2.jpg', 500, 1),
('红色文化帆布袋', 38.00, 'http://localhost:3000/img/turn-3.png', 150, 1),
('革命历史书签套装', 22.00, 'http://localhost:3000/img/turn-4.png', 300, 1);

-- ========== 商品详情（详情页内容）==========
CREATE TABLE IF NOT EXISTS product_details (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL COMMENT '关联 products.id',
  product_name VARCHAR(100) NOT NULL COMMENT '商品名称（快照）',
  subtitle VARCHAR(200) DEFAULT NULL COMMENT '副标题',
  description TEXT COMMENT '商品描述',
  images JSON DEFAULT NULL COMMENT '轮播图列表',
  content TEXT COMMENT '富文本详情',
  attrs JSON DEFAULT NULL COMMENT '商品属性键值对',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_product_details_product (product_id),
  CONSTRAINT fk_product_details_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品详情';

-- 插入商品详情数据
INSERT INTO product_details (product_id, product_name, subtitle, description, content) VALUES
(1, '红色主题笔记本', '记录红色足迹', '精选红色主题笔记本，采用优质纸张，适合书写学习心得与感悟。封面设计融合革命元素，内页印有党史金句，是党建学习和日常记录的理想之选。', '<p><strong>内页</strong>：米黄道林纸，适合钢笔与中性笔书写，不易洇墨。</p><p><strong>封面</strong>：压纹烫金工艺，主题纹样清晰耐磨。</p><p><strong>适用场景</strong>：党建学习笔记、会议记录、读书笔记与日常手账。</p><p><strong>规格提示</strong>：具体页数与开本以实物吊牌为准。</p>'),
(2, '薪火相传纪念徽章', '传承红色精神', '精美金属徽章，设计灵感来源于革命时期的勋章，象征着薪火相传的革命精神。做工精细，适合佩戴或收藏，是党员和红色文化爱好者的必备纪念品。', '<p><strong>材质工艺</strong>：锌合金电镀，表面抗氧化处理，色泽持久。</p><p><strong>佩戴方式</strong>：安全别针结构，可佩于胸前或置于展示盒收藏。</p><p><strong>保养建议</strong>：软布轻拭，避免硬物刮擦与强酸强碱接触。</p>'),
(3, '红色文化帆布袋', '背上红色情怀', '采用优质帆布材质，结实耐用，印有红色文化主题图案。简约大方，适合日常出行或学习使用，背出红色情怀与担当。', '<p><strong>面料</strong>：加厚帆布，肩带加固缝制，承重更稳。</p><p><strong>容量</strong>：可容纳雨伞、书本与水杯等日常物品。</p><p><strong>洗护</strong>：建议手洗阴干，避免漂白与暴晒。</p>'),
(4, '革命历史书签套装', '书香中的红色记忆', '一套四枚书签，分别以井冈山、延安、遵义、西柏坡为设计主题，选用金属材质，精致美观。搭配经典红色书籍使用，增添阅读仪式感。', '<p><strong>套装内容</strong>：井冈山、延安、遵义、西柏坡主题书签各一枚。</p><p><strong>材质</strong>：金属蚀刻与烤漆工艺，边角圆润不伤书页。</p><p><strong>使用</strong>：夹页稳固，适合纸质书与笔记本阅读场景。</p>');

-- ========== 购物车 ==========
CREATE TABLE IF NOT EXISTS carts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '关联 users.id',
  product_id INT NOT NULL COMMENT '关联 products.id',
  product_name VARCHAR(100) NOT NULL COMMENT '商品名称（快照）',
  product_price DECIMAL(10, 2) NOT NULL COMMENT '商品单价（快照）',
  product_thumb VARCHAR(255) DEFAULT NULL COMMENT '商品封面图（快照）',
  quantity INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_carts_user_product (user_id, product_id),
  KEY idx_carts_user (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_carts_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='购物车';

-- ========== 订单 ==========
CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(32) NOT NULL COMMENT '订单号',
  user_id INT NOT NULL COMMENT '关联 users.id',

  total_amount DECIMAL(10, 2) NOT NULL COMMENT '实付金额',

  address_id INT NOT NULL COMMENT '关联 user_addresses.id',
  receiver_name VARCHAR(50) NOT NULL COMMENT '收货人',
  receiver_phone VARCHAR(20) NOT NULL COMMENT '手机号',
  province VARCHAR(32) NOT NULL COMMENT '省',
  city VARCHAR(32) NOT NULL COMMENT '市',
  district VARCHAR(32) NOT NULL COMMENT '区',
  detail_address VARCHAR(255) NOT NULL COMMENT '详细地址',

  -- 0待付款 1待发货 2已发货 3取消中 4已完成 5已取消
  status TINYINT DEFAULT 0 COMMENT '订单状态',

  tracking_no VARCHAR(50) DEFAULT NULL COMMENT '快递单号',

  pay_time DATETIME DEFAULT NULL COMMENT '支付时间',
  deliver_time DATETIME DEFAULT NULL COMMENT '发货时间',
  receive_time DATETIME DEFAULT NULL COMMENT '收货时间',

  -- 商品快照列表（JSON数组）
  items JSON DEFAULT NULL COMMENT '商品列表 [{"product_id":1,"name":"xxx","price":128,"quantity":1}]',
  remark VARCHAR(255) DEFAULT NULL COMMENT '备注',

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_orders_order_no (order_no),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES user_addresses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='订单';
