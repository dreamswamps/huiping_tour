-- 若商品名在小程序里显示为问号，多半是首次导入编码错误导致库里已是乱码。
-- 用 UTF-8 客户端执行本脚本（Workbench / mysql --default-character-set=utf8mb4）。
USE hpt;

UPDATE products SET name = '红色主题笔记本' WHERE id = 1;
UPDATE products SET name = '薪火相传纪念徽章' WHERE id = 2;
UPDATE products SET name = '红色文化帆布袋' WHERE id = 3;
UPDATE products SET name = '革命历史书签套装' WHERE id = 4;

UPDATE product_details SET product_name = '红色主题笔记本' WHERE product_id = 1;
UPDATE product_details SET product_name = '薪火相传纪念徽章' WHERE product_id = 2;
UPDATE product_details SET product_name = '红色文化帆布袋' WHERE product_id = 3;
UPDATE product_details SET product_name = '革命历史书签套装' WHERE product_id = 4;
