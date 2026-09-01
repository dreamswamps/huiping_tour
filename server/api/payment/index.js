const crypto = require("crypto");
const express = require("express");
const pool = require("../../config/db");
const { requireUserAuth } = require("../../middleware/auth");
const { getPrivateKey } = require("../../utils/certHelper");
const axios = require("axios");

// 环境变量配置
const WEIXIN_CONFIG = {
  appid: process.env.WX_MINI_APPID,
  mchid: process.env.WECHAT_MCHID,
  apiv3Key: process.env.WECHAT_APIV3_KEY,
  serialNo: process.env.WECHAT_SERIAL_NO,
  privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH,
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
  isMock: process.env.ISMOCK === true,
};

// 订单状态常量
const ORDER_STATUS  ={
    pending: 0, //  待支付
    paid: 1,    //  已支付
    expired: 5, //  过期
    pay_fail_offline: 6,    //  商品下架
    pay_fail_stock: 7,      //  库存不足
    pay_fail_conn: 8,       //  数据库操作失败 
}

const router = express.Router();

// 用户发起支付请求
router.post("/pay", requireUserAuth, async (req, res) => {
  const userId = req.auth.userId;
  const orderId = Number(req.body.orderId);

  if (!orderId || orderId < 1) {
    return res.status(400).json({ code: 400, message: "订单ID无效" });
  }

//   提前声明连接池，避免finally卸载异常
  let conn = null;
  try {
    // 连接连接池操作失败会抛出异常，例如连接池不足
    conn = await pool.getConnection();
    // 查询订单 暂定states=0表示未支付 5表示失效订单
    const [orders] = await conn.query(
      "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 0",
      [orderId, userId]
    );

    const order = orders[0];

    if (!order) {
      return res.status(404).json({ code: 404, message: "订单不存在或已支付" });
    }

    // 根据JSON格式的items字段解析订单商品信息
    // 由于早期开发订单金额可被手动注入，因此在支付需重新计算金额
    // 注意⚠现阶段我不能保证items里的id字段是不能重复的，如果发现id字段可重复必须升级以下校验逻辑
    const items = order.items ? order.items : [];

    if ( !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ code: 400, message: "订单商品信息异常" });
    }
    // 根据items的product_id查询价格，乘quantity算出价格
    const itemMap = {};
    const ids = [];
    for (const item of items) {
        const pid = Number(item.product_id);
        const qty = Number(item.quantity);
        // 校验是否为正整数
        if (item.product_id < 1 || item.quantity < 1 ||
            !Number.isInteger(pid) || !Number.isInteger(qty)) {
            return res.status(400).json({ code: 400, message: "订单存在非法商品"+pid });
        }
        ids.push(pid);
        itemMap[pid] = qty;
    }

    // 根据ids检索匹配的商品价格、库存
    const [products] = await conn.query(
      `SELECT id, price, stock FROM products WHERE id IN (${ids.map(() => "?").join(",")}) AND status = 1`,
      ids
    );
    const priceMap = {};
    const stockMap = {};
    products.forEach(p => {
        priceMap[p.id] = Number(p.price);
        stockMap[p.id] = Number(p.stock);
    })

    // 重新计算总金额且校验库存是否足够
    // console.log(ids);
    // console.log(itemMap);
    // console.log(priceMap);
    let totalFee = 0;
    for (const id of ids) {
        const qty = itemMap[id];
        const price = priceMap[id];
        const availableStock = stockMap[id];
        if (availableStock == null || price == null) {
            return res.status(400).json({ code: 400, message: `商品ID ${id} 已下架` });
        }

        if (availableStock < qty) {
            return res.status(400).json({ code: 400, message: `商品ID ${id} 库存不足，当前库存：${availableStock}，需要：${qty}` });
        }
        // 四舍五入至分(理论上很难出现四舍五入的情况，除非后续加入折扣)
        totalFee += Math.round(price * qty * 100);
    }

    // 校验计算费用是否与存储数据的total_amount相同，不同则更新数据库
    // 若有需要可加入日志
    if ( (totalFee/100).toFixed(2) != order.total_amount) {
        await conn.query(
            `UPDATE orders SET total_amount = ? WHERE id = ?`,
            [(totalFee/100).toFixed(2), order.id]
        );
        console.log('检测到异常的订单价格');
    }
    // console.log(totalFee);

    // 获取用户的openid
    const [users] = await conn.query(
      `SELECT openid FROM users WHERE id = ?`,
      [userId]
    );
    if (!users[0]?.openid) {
      return res.status(400).json({ code: 400, message: "用户数据缺失" });
    }

    // 调用微信支付统一下单 使用ISMOCK=true可跳过微信支付流程
    if (WEIXIN_CONFIG.isMock) {
        // 传递Mock标识，前端调用回调函数
        res.json({
            code: 200,
            data: {
                // timeStamp,
                // nonceStr,
                // package: packageStr,
                // signType: "RSA",
                // paySign,
                mock: true
            }
        })
    } else {

    // AI生成
    const payResult = await wxUnifiedOrder({
        openid: users[0].openid,
        outTradeNo: order.order_no,
        totalFee: totalFee,
        description: `文旅订单-${order.order_no}`,
        });

    // 返回前端调起支付所需参数
    res.json({
        code: 200,
        data: {
            timeStamp: payResult.timeStamp,
            nonceStr: payResult.nonceStr,
            package: payResult.package,
            signType: "RSA",
            paySign: payResult.paySign,
        },
    });
    }
  } catch (error) {
    res.status(500).json({ code: 500, message: error || "支付失败" });
  } finally {
    if (conn) conn.release();
  }
});

// 微信支付回调
// 由于微信支付的回调会重试至多15次，需使用幂等处理避免重复操作
// 该接口的返回数据是用于通知微信支付是否接收回调成功，使用200/204状态码表示成功
// 使用5XX或4XX的状态码视为回调失败，微信支付会尝试重新回调
// https://pay.weixin.qq.com/doc/v3/merchant/4012791861
router.post("/callback", async (req, res) => {
    try {
        // TODO: 验证签名、解密数据
        // 拿到 out_trade_no 和 transaction_id

        const outTradeNo = "HPTMTB6FSEUCA26D415"; // 从解密数据中获取
        const transactionId = "wx123456"; // 从解密数据中获取

        let conn = null;
        try {
            conn = await pool.getConnection();
            // 幂等处理：已支付则直接返回成功
            const [orders] = await conn.query(
                `SELECT status, items FROM orders WHERE order_no = ?`,
                [outTradeNo]
            );
            if (orders.length === 0) {
                return res.status(200).json({ code: "FAIL", message: "订单不存在" });
            }
            if (orders[0].status !== ORDER_STATUS.pending) {
                return res.status(200).json({ code: "SUCCESS", message: "OK" });
            }

            // 解析订单商品信息，校验商品信息和库存
            const items = orders[0].items;
            const productIds = items.map(item => Number(item.product_id));

            // 需使用For Update锁定库存
            // 不建议将锁操作置入事务，会延长锁和事务的时间
            const [products] = await conn.query(
                `SELECT id, status, stock FROM products WHERE id IN (${productIds.map(() => '?').join(',')}) FOR UPDATE`,
                productIds
            );

            const stockMap = {};
            const statusMap = {};
            products.forEach(p => {
                stockMap[p.id] = Number(p.stock);
                statusMap[p.id] = Number(p.status);
            })

            // 校验是否下架、库存是否足够
            for (const item of items) {
                const pid = Number(item.product_id);
                const qty = Number(item.quantity);
                if (statusMap[pid] !== 1) {
                    await conn.query(`UPDATE orders SET status = 6 WHERE order_no = ?`, [outTradeNo]);
                    return res.status(200).json({ code: "FAIL", message: `存在过期商品ID ${pid}` });
                }
                if (stockMap[pid] < qty) {
                    await conn.query(`UPDATE orders SET status = 7 WHERE order_no = ?`, [outTradeNo]);
                    return res.status(200).json({ code: "FAIL", message: `商品ID ${pid}库存不足` });
                }
            }

            // 支付完成，执行更新订单业务
            // 扣除对应商品的库存
            // 更新订单状态为待发货(1)
            // 注意，后续需要更新该SQL语句，存储订单数据id
            await conn.beginTransaction();
            try {
                for (const item of items) {
                    const pid = Number(item.product_id);
                    const qty = Number(item.quantity);
                    const [result] = await conn.query(
                        `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
                        [qty, pid, qty]
                    );
                    // 并发操作仍可能出现校验库存是否充足后仍出现的超卖
                    if (result.affectedRows === 0) {
                        throw new Error(`库存不足：商品 ${pid}`);
                    }
                }
                await conn.query(
                    `UPDATE orders SET status = ?, pay_time = NOW() WHERE order_no = ?`,
                    [ORDER_STATUS.paid, outTradeNo]
                );
                await conn.commit();
            } catch (error) {
                await conn.rollback();
                await conn.query(
                    `UPDATE orders SET status = ? WHERE order_no = ?`,
                    [ORDER_STATUS.pay_fail_conn, outTradeNo]
                );
            }


            res.status(200).json({ code: "SUCCESS", message: "OK" });
        } finally {
            if (conn) conn.release();
        }
    } catch (err) {
        res.status(200).json({ code: "FAIL", message: err.message });
    }
});

// 调用微信支付统一下单 API
async function wxUnifiedOrder({ openid, outTradeNo, totalFee, description }) {
    const { appid, mchid, serialNo, notifyUrl } = WEIXIN_CONFIG;

    // 从证书工具获取私钥（替代文件路径）
    const privateKey = getPrivateKey();

    // 构造请求参数
    const url = "https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi";
    const nonceStr = crypto.randomBytes(16).toString("hex");
    const timestamp = Math.floor(Date.now() / 1000);

    const body = JSON.stringify({
        appid: appid,
        mchid: mchid,
        description: description,
        out_trade_no: outTradeNo,
        notify_url: notifyUrl,
        amount: {
            total: totalFee,
            currency: "CNY"
        },
        payer: {
            openid: openid
        }
    });

    // 构造签名串
    const signatureStr = [
        "POST",
        "/v3/pay/transactions/jsapi",
        timestamp,
        nonceStr,
        body,
        ""
    ].join("\n");

    // 使用私钥签名
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signatureStr);
    const signature = sign.sign(privateKey, "base64");

    // 构造 Authorization Header
    const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;

    // 发起请求
    const response = await axios.post(url, body, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader,
            "User-Agent": "Node.js"
        }
    });

    const prepayId = response.data.prepay_id;

    // 生成前端调起支付所需的参数
    const packageStr = `prepay_id=${prepayId}`;
    const timeStamp = String(Math.floor(Date.now() / 1000));
    const nonceStr2 = crypto.randomBytes(16).toString("hex");
    const signStr = [
        appid,
        timeStamp,
        nonceStr2,
        packageStr,
        ""
    ].join("\n");

    const sign2 = crypto.createSign("RSA-SHA256");
    sign2.update(signStr);
    const paySign = sign2.sign(privateKey, "base64");

    return {
        timeStamp: timeStamp,
        nonceStr: nonceStr2,
        package: packageStr,
        signType: "RSA",
        paySign: paySign,
    };
}

module.exports = router;