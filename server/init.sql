-- 红旅薪传小程序数据库初始化脚本
-- 数据库名: hpt

CREATE DATABASE IF NOT EXISTS hpt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE hpt;

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

-- ========== 商品 ==========
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  price DECIMAL(10, 2) NOT NULL COMMENT '价格',
  original_price DECIMAL(10, 2) COMMENT '原价',
  image VARCHAR(255) COMMENT '商品图片',
  stock INT DEFAULT 0 COMMENT '库存',
  status TINYINT DEFAULT 1 COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品';

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
