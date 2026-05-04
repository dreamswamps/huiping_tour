const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  // 先连接（不指定数据库）
  const conn = await mysql.createConnection({
    host: '110.40.187.34',
    port: 3306,
    user: 'root',
    password: 'zisu654321',
    multipleStatements: true
  });
  
  console.log('✅ 已连接MySQL，开始初始化数据库...');
  
  try {
    // 第1步：创建数据库
    await conn.query('CREATE DATABASE IF NOT EXISTS hpt DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci');
    console.log('✔ 数据库 hpt 创建成功');
    
    // 第2步：使用数据库
    await conn.query('USE hpt');
    
    // 第3步：创建表
    const tables = [
      `CREATE TABLE IF NOT EXISTS spots (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(100) NOT NULL COMMENT '景点名称',
        description TEXT COMMENT '景点描述',
        image VARCHAR(255) COMMENT '封面图片路径',
        category VARCHAR(50) COMMENT '分类',
        location VARCHAR(100) COMMENT '地址',
        latitude DECIMAL(10,6) COMMENT '纬度',
        longitude DECIMAL(10,6) COMMENT '经度',
        status TINYINT DEFAULT 1 COMMENT '状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL COMMENT '商品名称',
        description TEXT COMMENT '商品描述',
        price DECIMAL(10,2) NOT NULL COMMENT '价格',
        original_price DECIMAL(10,2) COMMENT '原价',
        image VARCHAR(255) COMMENT '商品图片',
        stock INT DEFAULT 0 COMMENT '库存',
        status TINYINT DEFAULT 1 COMMENT '状态',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      
      `CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        openid VARCHAR(64) UNIQUE NOT NULL COMMENT '微信openid',
        nickname VARCHAR(50) COMMENT '昵称',
        avatar VARCHAR(255) COMMENT '头像',
        score INT DEFAULT 0 COMMENT '积分',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
      
      `CREATE TABLE IF NOT EXISTS badges (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL COMMENT '徽章名称',
        icon VARCHAR(255) COMMENT '徽章图标',
        description VARCHAR(200) COMMENT '描述',
        condition_text VARCHAR(100) COMMENT '获取条件说明',
        sort_order INT DEFAULT 0 COMMENT '排序'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];
    
    for (const sql of tables) {
      await conn.query(sql);
      console.log('✔ 表创建成功');
    }
    
    // 第4步：插入示例数据
    const inserts = [
      ['spots', "(title, description, image, category, location) VALUES ('井冈山革命博物馆', '中国第一个农村革命根据地', '/img/banner1.svg', '红色景点', '江西省吉安市')"],
      ['spots', "(title, description, image, category, location) VALUES ('南昌起义纪念馆', '中国人民解放军诞生地', '/img/16.svg', '红色景点', '江西省南昌市')"],
      ['products', "(name, description, price, original_price, image, stock) VALUES ('红色记忆纪念册', '精美红色文化纪念册', 39.90, 59.90, '/img/17.svg', 100)"],
      ['products', "(name, description, price, original_price, image, stock) VALUES ('井冈山文创书签', '特色金属书签一套', 19.90, 29.90, '/img/18.svg', 200)"],
      ['badges', "(name, icon, description, condition_text, sort_order) VALUES ('红色先锋', '/img/1.svg', '完成首次打卡', '首次访问任一景点', 1)"],
      ['badges', "(name, icon, description, condition_text, sort_order) VALUES ('薪火传人', '/img/2.svg', '累计打卡5个景点', '打卡5个不同景点', 2)"]
    ];
    
    for (const [table, values] of inserts) {
      try {
        await conn.query(`INSERT IGNORE INTO ${table} ${values}`);
        console.log(`✔ 示例数据插入: ${table}`);
      } catch (e) {
        console.log(`⊘ 跳过(已存在): ${table}`);
      }
    }
    
    console.log('\n🎉 数据库初始化完成！');
  } catch (e) {
    console.error('❌ 初始化失败:', e.message);
  } finally {
    await conn.end();
  }
})();
