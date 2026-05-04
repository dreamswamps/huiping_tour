const mysql = require('mysql2/promise');

// 数据库连接配置
const dbConfig = {
  host: '110.40.187.34',
  port: 3306,
  user: 'root',
  password: 'zisu654321',
  database: 'hpt', // 数据库名，如不存在需要先创建
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL 数据库连接成功');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL 数据库连接失败:', err.message);
  });

module.exports = pool;
