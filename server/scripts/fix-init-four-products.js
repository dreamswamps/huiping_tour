/**
 * 修复 init.sql 写入的前 4 条商品（id 1～4）中文乱码；与 product_details 一并更新
 * 用法：在 server 目录执行  npm run seed:fix-init
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

const ROWS = [
  {
    id: 1,
    name: "红色主题笔记本",
    subtitle: "记录红色足迹",
    description:
      "精选红色主题笔记本，采用优质纸张，适合书写学习心得与感悟。封面设计融合革命元素，内页印有党史金句，是党建学习和日常记录的理想之选。",
    content:
      "<p><strong>内页</strong>：米黄道林纸，适合钢笔与中性笔书写，不易洇墨。</p><p><strong>封面</strong>：压纹烫金工艺，主题纹样清晰耐磨。</p><p><strong>适用场景</strong>：党建学习笔记、会议记录、读书笔记与日常手账。</p><p><strong>规格提示</strong>：具体页数与开本以实物吊牌为准。</p>",
  },
  {
    id: 2,
    name: "薪火相传纪念徽章",
    subtitle: "传承红色精神",
    description:
      "精美金属徽章，设计灵感来源于革命时期的勋章，象征着薪火相传的革命精神。做工精细，适合佩戴或收藏，是党员和红色文化爱好者的必备纪念品。",
    content:
      "<p><strong>材质工艺</strong>：锌合金电镀，表面抗氧化处理，色泽持久。</p><p><strong>佩戴方式</strong>：安全别针结构，可佩于胸前或置于展示盒收藏。</p><p><strong>保养建议</strong>：软布轻拭，避免硬物刮擦与强酸强碱接触。</p>",
  },
  {
    id: 3,
    name: "红色文化帆布袋",
    subtitle: "背上红色情怀",
    description:
      "采用优质帆布材质，结实耐用，印有红色文化主题图案。简约大方，适合日常出行或学习使用，背出红色情怀与担当。",
    content:
      "<p><strong>面料</strong>：加厚帆布，肩带加固缝制，承重更稳。</p><p><strong>容量</strong>：可容纳雨伞、书本与水杯等日常物品。</p><p><strong>洗护</strong>：建议手洗阴干，避免漂白与暴晒。</p>",
  },
  {
    id: 4,
    name: "革命历史书签套装",
    subtitle: "书香中的红色记忆",
    description:
      "一套四枚书签，分别以井冈山、延安、遵义、西柏坡为设计主题，选用金属材质，精致美观。搭配经典红色书籍使用，增添阅读仪式感。",
    content:
      "<p><strong>套装内容</strong>：井冈山、延安、遵义、西柏坡主题书签各一枚。</p><p><strong>材质</strong>：金属蚀刻与烤漆工艺，边角圆润不伤书页。</p><p><strong>使用</strong>：夹页稳固，适合纸质书与笔记本阅读场景。</p>",
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
    for (const r of ROWS) {
      await conn.query(`UPDATE products SET name = ? WHERE id = ?`, [
        r.name,
        r.id,
      ]);
      await conn.query(
        `UPDATE product_details SET product_name = ?, subtitle = ?, description = ?, content = ?
         WHERE product_id = ?`,
        [r.name, r.subtitle, r.description, r.content, r.id],
      );
    }
    await conn.commit();
    console.log(
      "✅ 已更新 id 1～4 商品与详情（含富文本 content），请从列表重新进入详情页查看",
    );
  } catch (e) {
    await conn.rollback();
    console.error("❌ 失败:", e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
