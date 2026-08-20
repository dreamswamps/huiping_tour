-- ============================================================
--  修复导入后的图片地址
--  hpt.sql 里 products.thumb 残留了旧开发地址
--  http://localhost:3000/img/turn-*.jpg
--  （且实际文件名是 turn-1.JPG 大写，Linux 区分大小写会 404）
--
--  执行：mysql -u hpt -p hpt < fix-image-urls.sql
-- ============================================================

-- 1) 把老地址批量替换为正式域名（域名改成你自己的）
UPDATE `products`
SET `thumb` = REPLACE(`thumb`, 'http://localhost:3000', 'https://huipingzhiyou.cn')
WHERE `thumb` LIKE '%localhost%';

-- 2) 文件名大小写修正：turn-1.JPG / turn-2.JPG（其余 turn-3~5 已是小写）
UPDATE `products`
SET `thumb` = REPLACE(`thumb`, 'img/turn-1.jpg', 'img/turn-1.JPG')
WHERE `thumb` LIKE '%turn-1.jpg%';

UPDATE `products`
SET `thumb` = REPLACE(`thumb`, 'img/turn-2.jpg', 'img/turn-2.JPG')
WHERE `thumb` LIKE '%turn-2.jpg%';

-- 3) 顺带清理 sys_oper_log 里无用的旧地址（可选，不影响功能）
-- UPDATE `sys_oper_log` SET `oper_param` = NULL WHERE `oper_param` LIKE '%localhost%';
