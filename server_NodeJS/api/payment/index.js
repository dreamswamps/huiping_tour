const crypto = require("crypto");
const express = require("express");
const pool = require("../../config/db");
const { requireUserAuth } = require("../../middleware/auth");
const { getPrivateKey } = require("../../utils/certHelper");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// 环境变量配置
const WEIXIN_CONFIG = {
    appid: process.env.WX_MINI_APPID,
    mchid: process.env.WECHAT_MCHID,
    apiv3Key: process.env.WECHAT_APIV3_KEY,
    serialNo: process.env.WECHAT_SERIAL_NO,
    privateKeyPath: process.env.WECHAT_PRIVATE_KEY_PATH,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL,
    isMock: false, //   是否跳过微信支付功能
};

// 订单状态常量
const ORDER_STATUS = {
    pending: 0, //  待支付
    paid: 1, //  已支付
    expired: 5, //  过期
    pay_fail_offline: 6, //  商品下架
    pay_fail_stock: 7, //  库存不足
    pay_fail_conn: 8, //  数据库操作失败
};

const router = express.Router();

// 用户发起支付请求
router.post("/pay", requireUserAuth, async (req, res) => {
    const userId = req.auth.userId;
    const orderId = Number(req.body.orderId);

    if (!orderId || orderId < 1) {
        return res.status(400).json({ code: 400, message: "订单ID无效" });
    }

    let conn = null;
    try {
        conn = await pool.getConnection();
        const [orders] = await conn.query(
            "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 0",
            [orderId, userId]
        );

        const order = orders[0];

        if (!order) {
            return res.status(404).json({ code: 404, message: "订单不存在或已支付" });
        }

        const items = order.items ? order.items : [];

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ code: 400, message: "订单商品信息异常" });
        }

        const itemMap = {};
        const ids = [];
        for (const item of items) {
            const pid = Number(item.product_id);
            const qty = Number(item.quantity);
            if (item.product_id < 1 || item.quantity < 1 ||
                !Number.isInteger(pid) || !Number.isInteger(qty)) {
                return res.status(400).json({ code: 400, message: "订单存在非法商品" + pid });
            }
            ids.push(pid);
            itemMap[pid] = qty;
        }

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
            totalFee += Math.round(price * qty * 100);
        }

        if ((totalFee / 100).toFixed(2) != order.total_amount) {
            await conn.query(
                `UPDATE orders SET total_amount = ? WHERE id = ?`,
                [(totalFee / 100).toFixed(2), order.id]
            );
            console.log('检测到异常的订单价格');
        }        

        const [users] = await conn.query(
            `SELECT openid FROM users WHERE id = ?`,
            [userId]
        );
        if (!users[0]?.openid) {
            return res.status(400).json({ code: 400, message: "用户数据缺失" });
        }

        if (WEIXIN_CONFIG.isMock) {
            res.json({
                code: 200,
                data: {
                    mock: true
                }
            })
        } else {
            const payResult = await wxUnifiedOrder({
                openid: users[0].openid,
                outTradeNo: order.order_no,
                totalFee: totalFee,
                description: `文旅订单-${order.order_no}`,
            });

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
        let errorMsg = error.message || "支付失败";
        if (error.response && error.response.data) {
            errorMsg = JSON.stringify(error.response.data);
        } else if (error.isAxiosError && error.request) {
            errorMsg = "微信支付服务不可达";
        }
        console.error('支付接口错误:', errorMsg);
        res.status(500).json({ code: 500, message: errorMsg });
    } finally {
        if (conn) conn.release();
    }
});

// 微信支付回调
router.post("/callback", async (req, res) => {
    try {
        const { out_trade_no: outTradeNo, transaction_id: transactionId } = req.body;

        let conn = null;
        try {
            conn = await pool.getConnection();
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

            const items = orders[0].items;
            const productIds = items.map(item => Number(item.product_id));

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

            await conn.beginTransaction();
            try {
                for (const item of items) {
                    const pid = Number(item.product_id);
                    const qty = Number(item.quantity);
                    const [result] = await conn.query(
                        `UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`,
                        [qty, pid, qty]
                    );
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

    // 从文件读取证书
    let privateKey;
    try {
        privateKey = getPrivateKey();
    } catch (error) {
        console.error('读取证书失败:', error.message);
        throw new Error('证书文件不存在或无法读取');
    }

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

    const signatureStr = [
        "POST",
        "/v3/pay/transactions/jsapi",
        timestamp,
        nonceStr,
        body,
        ""
    ].join("\n");

    const sign = crypto.createSign("RSA-SHA256");
    sign.update(signatureStr);
    const signature = sign.sign(privateKey, "base64");

    const authHeader = `WECHATPAY2-SHA256-RSA2048 mchid="${mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${serialNo}",signature="${signature}"`;
    let response;
    try {
        response = await axios.post(url, body, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
                "User-Agent": "Node.js"
            }
        });
    } catch (error) {
        if (error.response) {
            console.error('微信支付请求失败:', error.response.status, error.response.data);
            throw new Error(`微信支付错误: ${JSON.stringify(error.response.data)}`);
        }
        throw error;
    }

    const prepayId = response.data.prepay_id;

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