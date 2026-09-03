const crypto = require("crypto");
const express = require("express");
const pool = require("../../config/db");
const { requireUserAuth } = require("../../middleware/auth");
const {
  Product,
  ProductDetail,
  MallCart,
  Order,
} = require("../../models/mall");

const router = express.Router();

function genOrderNo() {
  const t = Date.now().toString(36).toUpperCase();
  const r = crypto.randomBytes(4).toString("hex").toUpperCase();
  const raw = `HPT${t}${r}`;
  return raw.length <= 32 ? raw : raw.slice(0, 32);
}

/** 商城列表：只读 products */
router.get("/products", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name, price, thumb, stock, status, created_at
       FROM products
       WHERE status = 1
       ORDER BY id ASC`,
    );
    const list = Product.fromRows(rows).map((p) => p.toListJSON());
    res.json({ code: 200, data: list });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

/**
 * 商品详情：只读 product_details（按 product_id）
 * 价格不在本表，由列表页入参带来，避免跨表查询
 */
router.get("/product-details", async (req, res) => {
  const productId = Number(req.query.productId);
  if (!Number.isFinite(productId) || productId <= 0) {
    return res.status(400).json({ code: 400, message: "无效或缺少 productId" });
  }
  try {
    const [rows] = await pool.query(
      `SELECT id, product_id, product_name, subtitle, description,
              images, content, attrs, updated_at
       FROM product_details
       WHERE product_id = ?
       LIMIT 1`,
      [productId],
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ code: 404, message: "未找到商品详情" });
    }
    const detail = ProductDetail.fromRow(row);
    res.json({ code: 200, data: detail.toPublicJSON() });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

/** 当前用户购物车（读 carts 表） */
router.get("/cart", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, product_id, product_name, product_price, product_thumb, quantity,
              created_at, updated_at
       FROM carts WHERE user_id = ? ORDER BY id ASC`,
      [userId],
    );
    const list = MallCart.fromRows(rows).map((c) => c.toPublicJSON());
    res.json({ code: 200, data: list });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
});

/**
 * 用前端快照覆盖服务端购物车（与本地 cart 对齐，写入 carts 表）
 * body: { items: [{ productId, name, price, thumb, quantity }] }
 */
router.put("/cart/sync", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  const rawItems = req.body && req.body.items;
  if (!Array.isArray(rawItems)) {
    return res.status(400).json({ code: 400, message: "items 须为数组" });
  }

  const normalized = [];
  for (const it of rawItems) {
    const productId = Number(it.productId != null ? it.productId : it.id);
    if (!Number.isInteger(productId) || productId < 1) continue;
    const name =
      typeof it.name === "string" ? it.name.trim().slice(0, 100) : "";
    const price = Number(it.price != null ? it.price : it.productPrice);
    const qty = Math.min(99, Math.max(1, Math.floor(Number(it.quantity) || 1)));
    const thumb =
      typeof it.thumb === "string"
        ? it.thumb.slice(0, 255)
        : typeof it.productThumb === "string"
          ? it.productThumb.slice(0, 255)
          : "";
    if (!name || !Number.isFinite(price) || price < 0) {
      return res.status(400).json({ code: 400, message: "商品名称或价格无效" });
    }
    normalized.push({ productId, name, price, thumb, qty });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM carts WHERE user_id = ?", [userId]);
    for (const row of normalized) {
      await conn.query(
        `INSERT INTO carts (user_id, product_id, product_name, product_price, product_thumb, quantity)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          row.productId,
          row.name,
          row.price,
          row.thumb || null,
          row.qty,
        ],
      );
    }
    await conn.commit();
    res.json({ code: 200, message: "购物车已同步" });
  } catch (e) {
    await conn.rollback();
    const msg =
      e && e.code === "ER_NO_REFERENCED_ROW_2"
        ? "存在无效的商品 id"
        : e.message;
    res.status(400).json({ code: 400, message: msg });
  } finally {
    conn.release();
  }
});

/**
 * 下单：从 carts 表组装 items JSON（不做 products 关联），扣减购物车对应行
 * body: { addressId, remark?, productIds?: number[] } 缺省 productIds 表示整单购物车
 */
router.post("/orders", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  const addressId = Number(req.body && req.body.addressId);
  const remark =
    typeof (req.body && req.body.remark) === "string"
      ? String(req.body.remark).trim().slice(0, 255)
      : null;
  let productIds = req.body && req.body.productIds;
  if (productIds == null) productIds = [];
  if (!Array.isArray(productIds)) {
    return res.status(400).json({ code: 400, message: "productIds 须为数组" });
  }
  productIds = [
    ...new Set(
      productIds
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n > 0),
    ),
  ];

  if (!Number.isInteger(addressId) || addressId < 1) {
    return res.status(400).json({ code: 400, message: "无效或缺少 addressId" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [addrRows] = await conn.query(
      `SELECT id, user_id, receiver_name, receiver_phone, province, city, district, detail_address
       FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1`,
      [addressId, userId],
    );
    const addr = addrRows[0];
    if (!addr) {
      await conn.rollback();
      return res.status(400).json({ code: 400, message: "收货地址不存在" });
    }

    const [cartRows] = await conn.query(
      `SELECT product_id, product_name, product_price, product_thumb, quantity
       FROM carts WHERE user_id = ?`,
      [userId],
    );
    let lines = MallCart.fromRows(
      cartRows.map((r) => ({
        id: 0,
        user_id: userId,
        product_id: r.product_id,
        product_name: r.product_name,
        product_price: r.product_price,
        product_thumb: r.product_thumb,
        quantity: r.quantity,
        created_at: null,
        updated_at: null,
      })),
    );
    if (productIds.length > 0) {
      const idSet = new Set(productIds);
      lines = lines.filter((l) => idSet.has(Number(l.productId)));
    }
    if (lines.length === 0) {
      await conn.rollback();
      return res
        .status(400)
        .json({ code: 400, message: "购物车为空或所选商品不在购物车中" });
    }

    const items = lines.map((l) => ({
      product_id: l.productId,
      name: l.productName,
      price: l.productPrice,
      quantity: l.quantity,
    }));
    const totalAmount =
      Math.round(
        items.reduce((s, it) => s + Number(it.price) * Number(it.quantity), 0) *
          100,
      ) / 100;
    const orderNo = genOrderNo();
    const itemsJson = JSON.stringify(items);

    const [insResult] = await conn.query(
      `INSERT INTO orders (
        order_no, user_id, total_amount, address_id,
        receiver_name, receiver_phone, province, city, district, detail_address,
        status, items, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        orderNo,
        userId,
        totalAmount,
        addressId,
        addr.receiver_name,
        addr.receiver_phone,
        addr.province,
        addr.city,
        addr.district,
        addr.detail_address,
        itemsJson,
        remark,
      ],
    );
    const lastId = insResult.insertId;

    const pids = lines.map((l) => l.productId);
    await conn.query(
      `DELETE FROM carts WHERE user_id = ? AND product_id IN (${pids.map(() => "?").join(",")})`,
      [userId, ...pids],
    );

    await conn.commit();

    const [orderRows] = await pool.query(
      `SELECT id, order_no, user_id, total_amount, address_id,
              receiver_name, receiver_phone, province, city, district, detail_address,
              status, tracking_no, pay_time, deliver_time, receive_time, items, remark,
              created_at, updated_at
       FROM orders WHERE id = ? LIMIT 1`,
      [lastId],
    );
    const order = Order.fromRow(orderRows[0]);
    res.json({
      code: 200,
      data: order ? order.toPublicJSON() : { id: lastId, orderNo },
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ code: 500, message: e.message });
  } finally {
    conn.release();
  }
});

/** 我的订单列表（当前用户） */
router.get("/orders", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  try {
    const [rows] = await pool.query(
      `SELECT id, order_no, user_id, total_amount, address_id,
              receiver_name, receiver_phone, province, city, district, detail_address,
              status, tracking_no, pay_time, deliver_time, receive_time, items, remark,
              created_at, updated_at
       FROM orders WHERE user_id = ?
       ORDER BY id DESC
       LIMIT 100`,
      [userId],
    );
    const list = Order.fromRows(rows).map((o) => o.toPublicJSON());
    res.json({ code: 200, data: list });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

/**
 * 取消订单：仅待付款(0)、待发货(1) 可取消为已取消(5)
 */
router.post("/orders/:id/cancel", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  const orderId = Number(req.params.id);
  if (!Number.isInteger(orderId) || orderId < 1) {
    return res.status(400).json({ code: 400, message: "无效的订单 id" });
  }
  try {
    const [rows] = await pool.query(
      "SELECT id, user_id, status FROM orders WHERE id = ? LIMIT 1",
      [orderId],
    );
    const row = rows[0];
    if (!row || Number(row.user_id) !== userId) {
      return res.status(404).json({ code: 404, message: "订单不存在" });
    }
    const st = Number(row.status);
    if (st === 5) {
      return res.status(400).json({ code: 400, message: "订单已取消" });
    }
    if (st === 4) {
      return res.status(400).json({ code: 400, message: "已完成订单无法取消" });
    }
    if (st === 2 || st === 3) {
      return res
        .status(400)
        .json({ code: 400, message: "当前状态不可取消，请联系客服" });
    }
    if (st !== 0 && st !== 1) {
      return res.status(400).json({ code: 400, message: "当前状态不可取消" });
    }
    await pool.query(
      "UPDATE orders SET status = 5, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?",
      [orderId, userId],
    );
    res.json({ code: 200, message: "已取消订单" });
  } catch (e) {
    res.status(500).json({ code: 500, message: e.message });
  }
});

// AI生成
// 发货（演示模式，允许用户自己发货）
router.post("/orders/:id/ship", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  const orderId = Number(req.params.id);

  if (!orderId || orderId < 1) {
    return res.status(400).json({ code: 400, message: "订单ID无效" });
  }

  let conn = null;
  try {
    conn = await pool.getConnection();
    // 1. 查询订单归属及当前状态
    const [rows] = await conn.query(
      "SELECT user_id, status FROM orders WHERE id = ?",
      [orderId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 404, message: "订单不存在" });
    }
    const order = rows[0];

    // 2. 归属校验（安全底线）
    if (order.user_id !== userId) {
      return res.status(403).json({ code: 403, message: "无权操作此订单" });
    }

    // 3. 状态机校验（幂等）
    if (order.status === 2) {
      // 已发货，直接返回成功（不报错，防连点）
      return res.status(200).json({ code: 200, message: "订单已发货，无需重复操作" });
    }
    if (order.status !== 1) {
      return res.status(400).json({ code: 400, message: "当前订单状态不可发货" });
    }

    // 4. 生成模拟物流单号
    const trackingNo = `DEMO-${orderId}-${Date.now()}`;

    // 5. 更新状态、发货时间、物流单号（加 status=1 乐观锁）
    const [result] = await conn.query(
      `UPDATE orders 
       SET status = 2, deliver_time = NOW(), tracking_no = ? 
       WHERE id = ? AND status = 1`,
      [trackingNo, orderId]
    );

    if (result.affectedRows === 0) {
      // 并发下可能已被其他请求更新，视为成功（幂等）
      return res.status(200).json({ code: 200, message: "订单已发货" });
    }

    res.status(200).json({ code: 200, message: "发货成功", data: { trackingNo } });
  } catch (error) {
    console.error("发货接口错误:", error.message);
    res.status(500).json({ code: 500, message: "服务器错误" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
