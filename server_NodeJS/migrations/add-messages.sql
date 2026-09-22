-- 已有 hpt 库时执行本脚本，新增传薪宣言留言表
USE hpt;

CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT '发布用户 users.id',
  content VARCHAR(50) NOT NULL COMMENT '留言内容，最多50字',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_messages_created (created_at),
  CONSTRAINT fk_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='传薪宣言留言';
