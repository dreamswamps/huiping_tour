/**
 * 用 Node 写入模拟商品（UTF-8 走参数绑定，避免 PowerShell 管道弄坏 SQL 文件里的中文）
 * 用法：在 server 目录执行  npm run seed:mock
 */
const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});
require("dotenv").config({
  path: path.join(__dirname, "..", "..", ".env"),
  override: true,
});

const mysql = require("mysql2/promise");

const ITEMS = [
  {
    name: "传薪红茶礼盒 200g",
    price: 128.0,
    thumb: "http://localhost:3000/img/turn-1.jpg",
    stock: 80,
    subtitle: "醇厚回甘 · 礼盒装",
    description:
      "选自赣东北高山茶园，传统工艺揉捻发酵，汤色红亮，香气高长。礼盒烫印红色纹样，适合馈赠亲友与党建活动伴手礼。",
    images: [
      "http://localhost:3000/img/turn-1.jpg",
      "http://localhost:3000/img/turn-2.jpg",
    ],
    content:
      "<p>建议水温 90～95℃，投茶量约 3～5g，首泡浸润约 10 秒后出汤，后续每泡适当延长。</p><p>干燥密封保存，避免阳光直射与异味。</p>",
    attrs: { 品类: "红茶", 净含量: "200g", 产地: "江西", 保质期: "24个月" },
  },
  {
    name: "千里岗毛尖罐装",
    price: 68.0,
    thumb: "http://localhost:3000/img/turn-2.jpg",
    stock: 120,
    subtitle: "清香鲜爽 · 口粮茶",
    description:
      "千里岗山脉云雾滋养，一芽一叶初展，白毫显露。汤色清绿明亮，滋味鲜醇，适合日常品饮与办公室冲泡。",
    images: [
      "http://localhost:3000/img/turn-2.jpg",
      "http://localhost:3000/img/turn-3.png",
    ],
    content:
      "<p>玻璃杯或盖碗均可；水温约 80～85℃，不宜久闷，以免涩感加重。</p>",
    attrs: { 品类: "绿茶", 净含量: "125g", 等级: "一级" },
  },
  {
    name: "薪火款陶瓷办公杯",
    price: 48.0,
    thumb: "http://localhost:3000/img/turn-3.png",
    stock: 200,
    subtitle: "高温瓷 · 握感舒适",
    description:
      "釉色温润，杯身线条简洁，杯盖可防尘保温。适合会议室、工位与车载场景，清洗方便。",
    images: [
      "http://localhost:3000/img/turn-3.png",
      "http://localhost:3000/img/turn-4.png",
    ],
    content: "<p>首次使用前请用温水清洗；避免骤冷骤热导致开裂。</p>",
    attrs: { 材质: "陶瓷", 容量: "约 380ml", 颜色: "霁红釉" },
  },
  {
    name: "红色研学伴手礼盒",
    price: 198.0,
    thumb: "http://localhost:3000/img/turn-4.png",
    stock: 45,
    subtitle: "茶礼 + 文创组合",
    description:
      "内含小罐茶与主题书签/明信片组合（具体以实物为准），包装庄重得体，适合研学团队、主题党日与参观纪念。",
    images: [
      "http://localhost:3000/img/turn-4.png",
      "http://localhost:3000/img/turn-1.jpg",
    ],
    content: "<p>如需团购或定制内配，请联系运营人员确认库存与交货周期。</p>",
    attrs: { 类型: "组合礼盒", 适用场景: "研学/党建", 备注: "内配以实物为准" },
  },
  {
    name: "方志敏语录精装笔记本",
    price: 36.0,
    thumb: "http://localhost:3000/img/turn-1.jpg",
    stock: 300,
    subtitle: "书写信仰 · 精装锁线",
    description:
      "内页穿插经典语录与留白书写区，纸张厚实不洇墨。封面压纹工艺，适合学习心得、会议记录与读书笔记。",
    images: ["http://localhost:3000/img/turn-1.jpg"],
    content: "<p>建议使用中性笔或钢笔书写；避免尖锐物刮擦封面。</p>",
    attrs: { 开本: "A5", 页数: "约 160 页", 装订: "锁线胶装" },
  },
];

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password:
      process.env.DB_PASSWORD != null ? String(process.env.DB_PASSWORD) : "",
    database: process.env.DB_NAME || "hpt",
    charset: "utf8mb4",
  });
  await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");

  await conn.beginTransaction();
  try {
    for (const it of ITEMS) {
      const [rows] = await conn.query(
        "SELECT id FROM products WHERE price = ? AND stock = ?",
        [it.price, it.stock],
      );
      for (const row of rows) {
        await conn.query("DELETE FROM product_details WHERE product_id = ?", [
          row.id,
        ]);
        await conn.query("DELETE FROM products WHERE id = ?", [row.id]);
      }
    }

    for (const it of ITEMS) {
      const [ins] = await conn.query(
        `INSERT INTO products (name, price, thumb, stock, status) VALUES (?, ?, ?, ?, 1)`,
        [it.name, it.price, it.thumb, it.stock],
      );
      const pid = ins.insertId;
      await conn.query(
        `INSERT INTO product_details (product_id, product_name, subtitle, description, images, content, attrs)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          pid,
          it.name,
          it.subtitle,
          it.description,
          JSON.stringify(it.images),
          it.content,
          JSON.stringify(it.attrs),
        ],
      );
    }

    await conn.commit();
    console.log("✅ 已写入 5 条模拟商品（含详情），请刷新小程序商城页。");
  } catch (e) {
    await conn.rollback();
    console.error("❌ 失败:", e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
