-- 多条「真实感」模拟商品（含 product_details，列表 + 详情可测）
-- 务必用 UTF-8 管道执行，否则中文会变问号：
--   Get-Content -Encoding UTF8 -Raw "...\server\seed-mock-product.sql" | mysql ... --default-character-set=utf8mb4
-- 若标题已是问号，执行 server/fix-seed-mock-names.sql 修复（按价格+库存定位）。
USE hpt;

-- 1
INSERT INTO products (name, price, thumb, stock, status) VALUES
('传薪红茶礼盒 200g', 128.00, 'http://localhost:3000/img/turn-1.jpg', 80, 1);
INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs) VALUES (
  LAST_INSERT_ID(),
  '传薪红茶礼盒 200g',
  '醇厚回甘 · 礼盒装',
  '选自赣东北高山茶园，传统工艺揉捻发酵，汤色红亮，香气高长。礼盒烫印红色纹样，适合馈赠亲友与党建活动伴手礼。',
  JSON_ARRAY(
    'http://localhost:3000/img/turn-1.jpg',
    'http://localhost:3000/img/turn-2.jpg'
  ),
  '<p>建议水温 90～95℃，投茶量约 3～5g，首泡浸润约 10 秒后出汤，后续每泡适当延长。</p><p>干燥密封保存，避免阳光直射与异味。</p>',
  JSON_OBJECT('品类', '红茶', '净含量', '200g', '产地', '江西', '保质期', '24个月')
);

-- 2
INSERT INTO products (name, price, thumb, stock, status) VALUES
('千里岗毛尖罐装', 68.00, 'http://localhost:3000/img/turn-2.jpg', 120, 1);
INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs) VALUES (
  LAST_INSERT_ID(),
  '千里岗毛尖罐装',
  '清香鲜爽 · 口粮茶',
  '千里岗山脉云雾滋养，一芽一叶初展，白毫显露。汤色清绿明亮，滋味鲜醇，适合日常品饮与办公室冲泡。',
  JSON_ARRAY('http://localhost:3000/img/turn-2.jpg', 'http://localhost:3000/img/turn-3.png'),
  '<p>玻璃杯或盖碗均可；水温约 80～85℃，不宜久闷，以免涩感加重。</p>',
  JSON_OBJECT('品类', '绿茶', '净含量', '125g', '等级', '一级')
);

-- 3
INSERT INTO products (name, price, thumb, stock, status) VALUES
('薪火款陶瓷办公杯', 48.00, 'http://localhost:3000/img/turn-3.png', 200, 1);
INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs) VALUES (
  LAST_INSERT_ID(),
  '薪火款陶瓷办公杯',
  '高温瓷 · 握感舒适',
  '釉色温润，杯身线条简洁，杯盖可防尘保温。适合会议室、工位与车载场景，清洗方便。',
  JSON_ARRAY('http://localhost:3000/img/turn-3.png', 'http://localhost:3000/img/turn-4.png'),
  '<p>首次使用前请用温水清洗；避免骤冷骤热导致开裂。</p>',
  JSON_OBJECT('材质', '陶瓷', '容量', '约 380ml', '颜色', '霁红釉')
);

-- 4
INSERT INTO products (name, price, thumb, stock, status) VALUES
('红色研学伴手礼盒', 198.00, 'http://localhost:3000/img/turn-4.png', 45, 1);
INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs) VALUES (
  LAST_INSERT_ID(),
  '红色研学伴手礼盒',
  '茶礼 + 文创组合',
  '内含小罐茶与主题书签/明信片组合（具体以实物为准），包装庄重得体，适合研学团队、主题党日与参观纪念。',
  JSON_ARRAY(
    'http://localhost:3000/img/turn-4.png',
    'http://localhost:3000/img/turn-1.jpg'
  ),
  '<p>如需团购或定制内配，请联系运营人员确认库存与交货周期。</p>',
  JSON_OBJECT('类型', '组合礼盒', '适用场景', '研学/党建', '备注', '内配以实物为准')
);

-- 5
INSERT INTO products (name, price, thumb, stock, status) VALUES
('方志敏语录精装笔记本', 36.00, 'http://localhost:3000/img/turn-1.jpg', 300, 1);
INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs) VALUES (
  LAST_INSERT_ID(),
  '方志敏语录精装笔记本',
  '书写信仰 · 精装锁线',
  '内页穿插经典语录与留白书写区，纸张厚实不洇墨。封面压纹工艺，适合学习心得、会议记录与读书笔记。',
  JSON_ARRAY('http://localhost:3000/img/turn-1.jpg'),
  '<p>建议使用中性笔或钢笔书写；避免尖锐物刮擦封面。</p>',
  JSON_OBJECT('开本', 'A5', '页数', '约 160 页', '装订', '锁线胶装')
);
