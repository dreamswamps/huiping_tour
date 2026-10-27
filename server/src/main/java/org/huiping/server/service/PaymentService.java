package org.huiping.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.core.notification.RequestParam;
import com.wechat.pay.java.service.payments.jsapi.JsapiServiceExtension;
import com.wechat.pay.java.service.payments.jsapi.model.Amount;
import com.wechat.pay.java.service.payments.jsapi.model.Payer;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayRequest;
import com.wechat.pay.java.service.payments.jsapi.model.PrepayWithRequestPaymentResponse;
import com.wechat.pay.java.service.payments.model.Transaction;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.Product;
import org.huiping.server.exception.ApiException;
import org.huiping.server.exception.BizException;
import org.huiping.server.exception.WechatPayNotifyException;
import org.huiping.server.mapper.OrderMapper;
import org.huiping.server.mapper.ProductMapper;
import org.huiping.server.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * 微信支付服务（对应 Node 端 api/payment/index.js）。
 * 订单状态常量（与 Node 端 ORDER_STATUS 一致）：
 *   0 待支付 / 1 已支付 / 5 已取消（过期）
 *   6 商品下架或不足 / 8 数据库操作失败
 */
@Service
public class PaymentService {
    private final PaymentTxService paymentTxService;
    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;
    private final JsapiServiceExtension jsapiServiceExtension;
    private final NotificationParser notificationParser;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String appid;
    private final String mchid;
    private final String notifyUrl;
    private final String publicKeyId;

    public PaymentService(PaymentTxService paymentTxService, OrderMapper orderMapper,
                          ProductMapper productMapper, UserMapper userMapper,
                          JsapiServiceExtension jsapiServiceExtension,
                          NotificationParser notificationParser,
                          @Value("${app.wechat.appid:}") String appid,
                          @Value("${app.wechat.pay.mchid:}") String mchid,
                          @Value("${app.wechat.pay.notify-url:}") String notifyUrl,
                          @Value("${app.wechat.pay.public-key-id:}") String publicKeyId) {
        this.paymentTxService = paymentTxService;
        this.orderMapper = orderMapper;
        this.productMapper = productMapper;
        this.userMapper = userMapper;
        this.jsapiServiceExtension = jsapiServiceExtension;
        this.notificationParser = notificationParser;
        this.appid = appid == null ? "" : appid;
        this.mchid = mchid == null ? "" : mchid;
        this.notifyUrl = notifyUrl == null ? "" : notifyUrl;
        this.publicKeyId = publicKeyId == null ? "" : publicKeyId;
    }

    /**
     * 用户发起支付：校验待支付订单与商品价格/库存，再调用微信统一下单。
     */
    public Map<String, Object> createWechatPayment(Long userId, Long orderId) {
        if (orderId == null || orderId < 1) {
            throw badRequest("订单ID无效");
        }
        Order order = orderMapper.selectPendingPaymentByIdAndUserId(orderId, userId);
        if (order == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "订单不存在或已支付");
        }
        List<Map<String, Object>> items;
        try {
            items = buildItems(order.getItems());
        } catch (Exception e) {
            throw badRequest("订单数据异常");
        }

        if (items.size() == 0) {
            throw badRequest("订单无数据");
        }

        // 逐项校验商品 id 与数量，并按顺序收集商品 id
        List<Long> ids = new ArrayList<>();
        Set<Long> seen = new HashSet<>();
        for (Map<String, Object> item : items) {
            long pid = ((Number) item.get("product_id")).longValue();
            int qty = ((Number) item.get("quantity")).intValue();
            if (pid < 1 || qty < 1) {
                throw badRequest("订单存在非法商品" + pid);
            }
            if (!seen.add(pid)) {
                throw badRequest("订单存在重复商品ID " + pid);
            }
            ids.add(pid);
        }

        // 读取商品当前价格与库存
        Map<Long, Product> priceMap = new HashMap<>();
        for (Product p : productMapper.selectByProductIds(ids)) {
            priceMap.put(p.getId(), p);
        }

        long totalFee = 0; // 单位：分
        for (Map<String, Object> item : items) {
            long pid = ((Number) item.get("product_id")).longValue();
            int qty = ((Number) item.get("quantity")).intValue();
            Product product = priceMap.get(pid);
            if (product == null || product.getPrice() == null || product.getStock() == null) {
                throw badRequest("商品ID " + pid + " 已下架");
            }
            BigDecimal price = product.getPrice();
            int availableStock = product.getStock();
            if (availableStock < qty) {
                throw badRequest("商品ID " + pid + " 库存不足，当前库存：" + availableStock + "，需要：" + qty);
            }
            totalFee += price.multiply(BigDecimal.valueOf(qty)).movePointRight(2)
                    .setScale(0, RoundingMode.HALF_UP).longValueExact();
        }

        // TEST-ONLY: ONE-CENT-PAY 强制1分钱支付测试，上线前删除
        totalFee = 1L;

        // 校验订单金额，异常则回写为按当前价格重新计算的值
        BigDecimal computed = BigDecimal.valueOf(totalFee).movePointLeft(2);
        BigDecimal orderTotal = order.getTotalAmount();
        if (orderTotal == null || computed.compareTo(orderTotal) != 0) {
            orderMapper.updateTotal(orderId, computed);
        }

        String openid = userMapper.selectOpenidByUserId(userId);
        if (openid == null || openid.isBlank()) {
            throw badRequest("用户数据缺失");
        }

        // 使用官方 SDK 统一下单并生成小程序支付参数
        PrepayRequest request = new PrepayRequest();
        request.setAppid(appid);
        request.setMchid(mchid);
        request.setDescription("文旅订单-" + order.getOrderNo());
        request.setOutTradeNo(order.getOrderNo());
        request.setNotifyUrl(notifyUrl);
        Amount amount = new Amount();
        amount.setTotal((int) totalFee);
        request.setAmount(amount);
        Payer payer = new Payer();
        payer.setOpenid(openid);
        request.setPayer(payer);

        PrepayWithRequestPaymentResponse response = jsapiServiceExtension.prepayWithRequestPayment(request);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timeStamp", response.getTimeStamp());
        result.put("nonceStr", response.getNonceStr());
        result.put("package", response.getPackageVal());
        result.put("signType", response.getSignType());
        result.put("paySign", response.getPaySign());
        return result;
    }

    /**
     * 微信支付回调：验签 + 解密 + 业务校验，再扣减库存。
     * 验签/解密失败抛 {@link WechatPayNotifyException}（由 Controller 转 401 让微信重试）；
     * 业务校验失败直接返回 SUCCESS（不重试）。
     */
    public Map<String, Object> receiveWechatPaymentNotify(String body, String timestamp, String nonce,
                                                          String signature, String serial) {
        // 0. 显式校验序列号：Wechatpay-Serial 必须与配置的 publicKeyId 一致，否则按验签失败处理
        if (publicKeyId.isBlank() || !publicKeyId.equals(serial)) {
            throw new WechatPayNotifyException("微信支付回调序列号不匹配", null);
        }

        // 验签 + 解密，订单号只能从解密后的密文里取
        Transaction tx;
        try {
            RequestParam requestParam = new RequestParam.Builder()
                    .serialNumber(serial)
                    .signature(signature)
                    .timestamp(timestamp)
                    .nonce(nonce)
                    .body(body)
                    .build();
            tx = notificationParser.parse(requestParam, Transaction.class);
        } catch (Exception e) {
            throw new WechatPayNotifyException("微信支付回调验签或解密失败", e);
        }

        // 1. 取订单号查订单
        String orderNo = tx.getOutTradeNo();
        // TODO: 此处应记录 transaction_id（tx.getTransactionId()）和支付流水，当前未落库，后续需补流水表
        Order order = orderMapper.selectByOrderNo(orderNo);
        if (order == null) {
            // 需要日志记录订单异常
            return successRequest();
        }

        // 2. 幂等检查
        if (order.getStatus() != null && order.getStatus() != 0) {
            return successRequest();
        }

        // 3. 支付状态必须为 SUCCESS
        if (tx.getTradeState() == null || !"SUCCESS".equals(tx.getTradeState().name())) {
            // 需要日志记录订单异常
            return successRequest();
        }

        // 4. 商户号与 appid 必须与配置一致
        if (!mchid.equals(tx.getMchid()) || !appid.equals(tx.getAppid())) {
            // 需要日志记录订单异常
            return successRequest();
        }

        // 5. 币种校验：必须为 CNY
        String currency = tx.getAmount() == null ? null : tx.getAmount().getCurrency();
        if (currency != null && !"CNY".equals(currency)) {
            orderMapper.updateStatusByOrderNo(orderNo, 11); // 订单异常（OrderStatus.HUMAN_INTERVENTION）
            // TODO: 需要日志记录异常订单，币种非 CNY，订单号 + orderNo
            return successRequest();
        }

        // 6. 金额校验：amount.total（分）与订单 total_amount（元）一致
        Integer paidFen = tx.getAmount() == null ? null : tx.getAmount().getTotal();
        if (paidFen == null || order.getTotalAmount() == null) {
            orderMapper.updateStatusByOrderNo(orderNo, 11); // 订单异常（OrderStatus.HUMAN_INTERVENTION）
            // TODO: 需要日志记录异常订单，金额缺失，订单号 + orderNo
            return successRequest();
        }
        long orderFen = order.getTotalAmount().movePointRight(2).longValueExact();
        if (orderFen != paidFen) {
            orderMapper.updateStatusByOrderNo(orderNo, 11); // 订单异常（OrderStatus.HUMAN_INTERVENTION）
            // TODO: 需要日志记录异常订单，金额不一致，订单号 + orderNo
            return successRequest();
        }

        List<Map<String, Object>> items;
        try {
            items = buildItems(order.getItems());
        } catch (Exception e) {
            return successRequest();
        }

        try {
            paymentTxService.deductStockAndMarkPaid(orderNo, items);
        } catch (BizException e) {
            orderMapper.updateStatusByOrderNo(orderNo, e.getCode());
        } catch (Exception e) {
            orderMapper.updateStatusByOrderNo(orderNo, 8);
        }
        // TODO: 支付成功后自动发货扩展点，当前为手动 ship 触发，暂不实现
        return successRequest();
    }

    /** 订单 items 可能来自 MyBatis JSON 字符串，也可能已经被驱动解析成 List。 */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buildItems(Object raw) throws Exception {
        if (raw instanceof String value) {
            return objectMapper.readValue(value, new TypeReference<>() {});
        }
        if (raw instanceof List<?> list) {
            return (List<Map<String, Object>>) list;
        }
        return List.of();
    }

    private Map<String, Object> successRequest() {
        return Map.of("code", "SUCCESS", "message", "OK");
    }

    private ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
