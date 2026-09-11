const crypto = require("crypto");
const axios = require("axios");
const pool = require("../config/db");

function isMockEnabled(value) {
  if (typeof value === "boolean") return value;
  return String(process.env.MOCK_DELIVERY || "true").toLowerCase() !== "false";
}

function getTrackingNo(data) {
  const keys = ["trackingNo", "tracking_no", "waybillNo", "waybill_no", "mailNo", "mail_no"];
  if (!data || typeof data !== "object") return "";
  for (const key of keys) {
    if (data[key]) return String(data[key]);
  }
  for (const value of Object.values(data)) {
    const found = getTrackingNo(value);
    if (found) return found;
  }
  return "";
}

async function findOrder(orderId, userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, order_no, status, receiver_name, receiver_phone,
            province, city, district, detail_address, items
     FROM orders WHERE id = ? LIMIT 1`,
    [orderId],
  );
  const order = rows[0];
  if (!order) {
    const error = new Error("订单不存在");
    error.statusCode = 404;
    throw error;
  }
  if (userId != null && Number(order.user_id) !== Number(userId)) {
    const error = new Error("无权操作此订单");
    error.statusCode = 403;
    throw error;
  }
  if (Number(order.status) === 2) return { order, alreadyDelivered: true };
  if (Number(order.status) !== 1) {
    const error = new Error("当前订单状态不可发货");
    error.statusCode = 400;
    throw error;
  }
  return { order, alreadyDelivered: false };
}

async function saveDelivery(orderId, trackingNo) {
  const [result] = await pool.query(
    `UPDATE orders
     SET status = 2, deliver_time = NOW(), tracking_no = ?
     WHERE id = ? AND status = 1`,
    [trackingNo, orderId],
  );
  if (result.affectedRows === 0) {
    return { trackingNo, alreadyDelivered: true };
  }
  return { trackingNo, alreadyDelivered: false };
}

async function mockDeliver(orderId, userId) {
  const { order, alreadyDelivered } = await findOrder(orderId, userId);
  if (alreadyDelivered) return { trackingNo: order.tracking_no, alreadyDelivered: true };
  const trackingNo = `DEMO-${orderId}-${Date.now()}`;
  console.log(`[delivery] Mock 发货 orderId=${orderId}, trackingNo=${trackingNo}`);
  return saveDelivery(orderId, trackingNo);
}

async function realDeliver(orderId, userId) {
  const { order, alreadyDelivered } = await findOrder(orderId, userId);
  if (alreadyDelivered) return { trackingNo: order.tracking_no, alreadyDelivered: true };

  const endpoint = String(process.env.CAINIAO_URL || "").trim();
  const appKey = String(process.env.CAINIAO_APP_KEY || "").trim();
  const appSecret = String(process.env.CAINIAO_APP_SECRET || "").trim();
  const sellerId = String(process.env.CAINIAO_SELLER_ID || "TEST_SELLER_ID").trim();
  const isSandbox = String(process.env.CAINIAO_SANDBOX || "false").toLowerCase() === "true";

  if (isSandbox) {
    const trackingNo = `SF${Date.now()}${String(orderId).padStart(4, "0")}`;
    console.log(`[delivery] Cainiao 沙箱发货 orderId=${orderId}, trackingNo=${trackingNo}`);
    return saveDelivery(orderId, trackingNo);
  }

  try {
    if (!endpoint || !appKey || !appSecret) {
      throw new Error("未配置完整的 CAINIAO_URL、CAINIAO_APP_KEY 或 CAINIAO_APP_SECRET");
    }

    const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
    const sender = {
      name: process.env.CAINIAO_SENDER_NAME || "红旅薪传",
      phone: process.env.CAINIAO_SENDER_PHONE || "",
      province: process.env.CAINIAO_SENDER_PROVINCE || "",
      city: process.env.CAINIAO_SENDER_CITY || "",
      district: process.env.CAINIAO_SENDER_DISTRICT || "",
      address: process.env.CAINIAO_SENDER_ADDRESS || "",
    };
    const receiver = {
      name: order.receiver_name || "",
      phone: order.receiver_phone || "",
      province: order.province || "",
      city: order.city || "",
      district: order.district || "",
      address: order.detail_address || "",
    };
    if (!receiver.name || !receiver.phone || !receiver.address) {
      throw new Error("订单缺少收件人姓名、手机号或收货地址");
    }

    // 菜鸟标准接口通常将业务字段放在 biz_content 中；具体字段名以开通的产品文档为准。
    const bizContent = {
      seller_id: sellerId,
      logistics_code: "SF",
      order_no: order.order_no,
      sender,
      receiver,
      package_weight: Number(process.env.CAINIAO_DEFAULT_WEIGHT || 1000),
    };
    const params = {
      app_key: appKey,
      method: "cainiao.waybill.get",
      format: "json",
      v: "2.0",
      timestamp,
      sign_method: "md5",
      biz_content: JSON.stringify(bizContent),
    };
    const signText = Object.keys(params)
      .sort()
      .map((key) => `${key}${params[key]}`)
      .join("");
    params.sign = crypto
      .createHash("md5")
      .update(`${appSecret}${signText}${appSecret}`, "utf8")
      .digest("hex")
      .toUpperCase();

    console.log(`[delivery] Cainiao 真实下单 orderId=${orderId}, endpoint=${endpoint}`);
    const response = await axios.post(endpoint, new URLSearchParams(params).toString(), {
      timeout: 10000,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    let body = response.data;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        throw new Error("菜鸟接口返回了无法解析的响应");
      }
    }
    const result = body?.result || body;
    const code = result?.code ?? body?.code;
    const message = result?.msg || result?.sub_msg || body?.msg || body?.sub_msg;
    if (code != null && String(code) !== "0") {
      throw new Error(`菜鸟下单失败：${message || `错误码 ${code}`}`);
    }
    if (result?.success === false || body?.success === false) {
      throw new Error(`菜鸟下单失败：${message || "接口返回失败"}`);
    }

    const trackingNo = getTrackingNo(body) || getTrackingNo({
      waybill_code: result?.waybill_code,
      mail_no: result?.mail_no,
    });
    if (!trackingNo) {
      throw new Error(`菜鸟下单失败：接口未返回运单号${message ? `（${message}）` : ""}`);
    }
    console.log(`[delivery] Cainiao 下单成功 orderId=${orderId}, trackingNo=${trackingNo}`);
    return saveDelivery(orderId, trackingNo);
  } catch (error) {
    const detail = error.response?.data?.msg || error.response?.data?.sub_msg || error.message;
    console.error(`[delivery] Cainiao 发货失败 orderId=${orderId}:`, detail);
    if (String(detail).startsWith("菜鸟") || String(detail).startsWith("订单") || String(detail).startsWith("未配置")) {
      throw new Error(detail);
    }
    throw new Error(`菜鸟发货失败：${detail || "未知错误"}`);
  }
}

async function deliverOrder(orderId, useMock, userId) {
  const mock = isMockEnabled(useMock);
  console.log(`[delivery] 开始发货 orderId=${orderId}, mock=${mock}`);
  return mock ? mockDeliver(orderId, userId) : realDeliver(orderId, userId);
}

module.exports = { mockDeliver, realDeliver, deliverOrder };