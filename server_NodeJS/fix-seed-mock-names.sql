-- 修复「五条模拟商品」中文名（标题问号时执行；按价格+库存定位，避免写死 id）
-- 执行：Get-Content -Encoding UTF8 -Raw "...\server\fix-seed-mock-names.sql" | mysql -h 127.0.0.1 -P 3306 -u root -p --default-character-set=utf8mb4
USE hpt;

UPDATE products SET name = '传薪红茶礼盒 200g' WHERE price = 128.00 AND stock = 80 ORDER BY id DESC LIMIT 1;
UPDATE products SET name = '千里岗毛尖罐装' WHERE price = 68.00 AND stock = 120 ORDER BY id DESC LIMIT 1;
UPDATE products SET name = '薪火款陶瓷办公杯' WHERE price = 48.00 AND stock = 200 ORDER BY id DESC LIMIT 1;
UPDATE products SET name = '红色研学伴手礼盒' WHERE price = 198.00 AND stock = 45 ORDER BY id DESC LIMIT 1;
UPDATE products SET name = '方志敏语录精装笔记本' WHERE price = 36.00 AND stock = 300 ORDER BY id DESC LIMIT 1;

UPDATE product_details pd
INNER JOIN products p ON p.id = pd.product_id
SET pd.product_name = p.name
WHERE (p.price = 128.00 AND p.stock = 80)
   OR (p.price = 68.00 AND p.stock = 120)
   OR (p.price = 48.00 AND p.stock = 200)
   OR (p.price = 198.00 AND p.stock = 45)
   OR (p.price = 36.00 AND p.stock = 300);
