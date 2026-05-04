-- 红旅薪传小程序数据库初始化脚本
-- 数据库名: hpt

CREATE DATABASE IF NOT EXISTS hpt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE hpt;

-- 景点表
CREATE TABLE IF NOT EXISTS spots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(100) NOT NULL COMMENT '景点名称',
  description TEXT COMMENT '景点描述',
  image VARCHAR(255) COMMENT '封面图片路径',
  category VARCHAR(50) COMMENT '分类',
  location VARCHAR(100) COMMENT '地址',
  latitude DECIMAL(10,6) COMMENT '纬度',
  longitude DECIMAL(10,6) COMMENT '经度',
  status TINYINT DEFAULT 1 COMMENT '状态 1=启用 0=禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='景点信息表';

-- 商品表（商城）
CREATE TABLE IF NOT EXISTS products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  description TEXT COMMENT '商品描述',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  original_price DECIMAL(10,2) COMMENT '原价',
  image VARCHAR(255) COMMENT '商品图片',
  stock INT DEFAULT 0 COMMENT '库存',
  status TINYINT DEFAULT 1 COMMENT '状态 1=上架 0=下架',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商城商品表';

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) UNIQUE NOT NULL COMMENT '微信openid',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像',
  score INT DEFAULT 0 COMMENT '积分',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 任务徽章表
CREATE TABLE IF NOT EXISTS badges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL COMMENT '徽章名称',
  icon VARCHAR(255) COMMENT '徽章图标',
  description VARCHAR(200) COMMENT '描述',
  condition_text VARCHAR(100) COMMENT '获取条件说明',
  sort_order INT DEFAULT 0 COMMENT '排序'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务徽章表';

-- 插入示例数据（可选）
INSERT INTO spots (title, description, image, category, location) VALUES 
('井冈山革命博物馆', '中国第一个农村革命根据地', '/img/banner1.svg', '红色景点', '江西省吉安市'),
('南昌起义纪念馆', '中国人民解放军诞生地', '/img/16.svg', '红色景点', '江西省南昌市');

INSERT INTO products (name, description, price, original_price, image, stock) VALUES 
('红色记忆纪念册', '精美红色文化纪念册', 39.90, 59.90, '/img/17.svg', 100),
('井冈山文创书签', '特色金属书签一套', 19.90, 29.90, '/img/18.svg', 200);

INSERT INTO badges (name, icon, description, condition_text, sort_order) VALUES 
('红色先锋', '/img/1.svg', '完成首次打卡', '首次访问任一景点', 1),
('薪火传人', '/img/2.svg', '累计打卡5个景点', '打卡5个不同景点', 2);
