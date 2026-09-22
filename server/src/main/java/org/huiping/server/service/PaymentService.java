package org.huiping.server.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.Product;
import org.huiping.server.exception.ApiException;
import org.huiping.server.exception.BizException;
import org.huiping.server.mapper.OrderMapper;
import org.huiping.server.mapper.ProductMapper;
import org.huiping.server.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.security.PrivateKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.util.*;

/**
 * 微信支付服务（对应 Node 端 api/payment/index.js）。
 * 理论上并不是所有错误都该返回
 * 订单状态常量（与 Node 端 ORDER_STATUS 一致）：
 *   0 待支付 / 1 已支付 / 5 已取消（过期）
 *   6 商品下架或不足 / 8 数据库操作失败
 */
//  TODO 该页面会包含强制数据类型转换，后续开发可考虑优化，数据强转源于Node JS
@Service
public class PaymentService {
    private final PaymentTxService paymentTxService;
    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;
    private final UserMapper userMapper;
    private final CertHelper certHelper;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();
    private final SecureRandom secureRandom = new SecureRandom();

    private final String appid;
    private final String mchid;
    private final String serialNo;
    private final String notifyUrl;
    private final boolean mock;

    public PaymentService(PaymentTxService paymentTxService, OrderMapper orderMapper,
                          ProductMapper productMapper, UserMapper userMapper,
                          CertHelper certHelper,
                          @Value("${app.wechat.appid:}") String appid,
                          @Value("${app.wechat.pay.mchid:}") String mchid,
                          @Value("${app.wechat.pay.serial-no:}") String serialNo,
                          @Value("${app.wechat.pay.notify-url:}") String notifyUrl,
                          @Value("${app.wechat.pay.mock:false}") boolean mock) {
        this.paymentTxService = paymentTxService;
        this.orderMapper = orderMapper;
        this.productMapper = productMapper;
        this.userMapper = userMapper;
        this.certHelper = certHelper;
        this.appid = appid == null ? "" : appid;
        this.mchid = mchid == null ? "" : mchid;
        this.serialNo = serialNo == null ? "" : serialNo;
        this.notifyUrl = notifyUrl == null ? "" : notifyUrl;
        this.mock = mock;
    }

    /**
     * 用户发起支付：校验待支付订单与商品价格/库存，再调用微信统一下单（或返回模拟参数）。
     */
    public Map<String, Object> createWXPayment(Long userId, Long orderId) {
        if (orderId == null || orderId < 1) {
            throw badRequest("订单ID无效");
        }
        Order order = orderMapper.findPendingOrder(orderId, userId);
        if (order == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "订单不存在或已支付");
        }
        List<Map<String, Object>> items;
        try {
            items = buildItems(order.getItems());
        } catch (Exception e) {
//            log.error("订单商品信息异常 orderNo={}", orderNo, e);
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
        for (Product p : productMapper.findPublishedByIds(ids)) {
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
//            注意，微信支付按分计算而不是元
            totalFee += price.multiply(BigDecimal.valueOf(qty)).movePointRight(2)
                    .setScale(0, RoundingMode.HALF_UP).longValueExact();
        }

        // 校验订单金额，异常则回写为按当前价格重新计算的值
        BigDecimal computed = BigDecimal.valueOf(totalFee).movePointLeft(2);
        BigDecimal orderTotal = order.getTotal_amount();
        if (orderTotal == null || computed.compareTo(orderTotal) != 0) {
//            TODO 加入日志，追溯异常帐号
            orderMapper.updateOrderTotal(orderId, computed);
        }

        String openid = userMapper.findOpenidByUserId(userId);
        if (openid == null || openid.isBlank()) {
            throw badRequest("用户数据缺失");
        }

        if (mock) {
            return Map.of("mock", true);
        }
        return wxUnifiedOrder(openid, order.getOrder_no(), totalFee,
                "文旅订单-" + order.getOrder_no());
    }

    /**
     * 微信支付回调：幂等检查、下架/库存校验、库存扣减与订单状态更新。
     * 微信回调未做验签/解密，仅处理业务状态（与 Node 端保持一致）。
     * 注意，目前使用在deductStockAndMarkPaid保证数据库锁操作，之前的代码仅处于弱并发的状态
     */
    // TODO: 当前回调未做微信 V3 验签、未解密 resource.ciphertext，仅适用于 mock/联调。真实微信回调需要平台证书 + WECHAT_APIV3_KEY，属于未完成功能，严禁直接上生产。
    public Map<String, Object> handleWXPaymentNotify(String orderNo) {
        Order order = orderMapper.findByOrderNo(orderNo);
        if (order == null) {
//            改为日志  "订单不存在"
            return successRequest();
        }
//        幂等处理，源于微信会有多次回调
        if (order.getStatus() != null && order.getStatus() != 0) return successRequest();

        List<Map<String, Object>> items;
        try {
            items = buildItems(order.getItems());
        } catch (Exception e) {
//            改为日志  "订单商品信息异常"
            return successRequest();
        }

        try {
            paymentTxService.deductStockAndMarkPaid(orderNo, items);
        } catch (BizException e) {
            orderMapper.markFailure(orderNo, e.getCode());
        }
        catch (Exception e) {
            orderMapper.markFailure(orderNo, 8);
        }
        return successRequest();
    }

    /** 调用微信支付统一下单 API，返回小程序支付参数。 */
    private Map<String, Object> wxUnifiedOrder(String openid, String outTradeNo, long totalFee, String description) {
        // 从文件读取证书
        PrivateKey privateKey;
        try {
            privateKey = certHelper.getPrivateKey();
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "证书文件不存在或无法读取");
        }

        String url = "https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi";
        String nonceStr = randomHex(32);
        long timestamp = System.currentTimeMillis() / 1000;

        Map<String, Object> amount = new LinkedHashMap<>();
        amount.put("total", totalFee);
        amount.put("currency", "CNY");
        Map<String, Object> payer = new LinkedHashMap<>();
        payer.put("openid", openid);
        Map<String, Object> bodyMap = new LinkedHashMap<>();
        bodyMap.put("appid", appid);
        bodyMap.put("mchid", mchid);
        bodyMap.put("description", description);
        bodyMap.put("out_trade_no", outTradeNo);
        bodyMap.put("notify_url", notifyUrl);
        bodyMap.put("amount", amount);
        bodyMap.put("payer", payer);

        String body;
        try {
            body = objectMapper.writeValueAsString(bodyMap);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付请求体序列化失败");
        }

        String signatureStr = "POST\n/v3/pay/transactions/jsapi\n" + timestamp + "\n" + nonceStr + "\n" + body + "\n";
        String signature = rsaSign(signatureStr, privateKey);
        String authHeader = "WECHATPAY2-SHA256-RSA2048 mchid=\"" + mchid + "\",nonce_str=\"" + nonceStr
                + "\",timestamp=\"" + timestamp + "\",serial_no=\"" + serialNo + "\",signature=\"" + signature + "\"";

        Map<String, Object> response;
        try {
            String responseBody = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", authHeader)
                    .header("User-Agent", "Java")
                    .body(body)
                    .retrieve()
                    .body(String.class);
            response = objectMapper.readValue(responseBody, new TypeReference<Map<String, Object>>() {});
        } catch (RestClientResponseException e) {
//            TODO 使用日志记录异常数据
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付错误: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付服务不可达");
        }

//        微信支付的回参，可能出现状态码为200的错误变体，此场景没有prepay_id
        Object prepayIdObj = response.get("prepay_id");
        if (prepayIdObj == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "微信未返回 prepay_id");
        }
        String prepayId = String.valueOf(prepayIdObj);
        String packageStr = "prepay_id=" + prepayId;
        String timeStamp = String.valueOf(System.currentTimeMillis() / 1000);
        String nonceStr2 = randomHex(32);
        String signStr = appid + "\n" + timeStamp + "\n" + nonceStr2 + "\n" + packageStr + "\n";
        String paySign = rsaSign(signStr, privateKey);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("timeStamp", timeStamp);
        result.put("nonceStr", nonceStr2);
        result.put("package", packageStr);
        result.put("signType", "RSA");
        result.put("paySign", paySign);
        return result;
    }

    /** RSA-SHA256 签名并 Base64 编码。 */
    private String rsaSign(String message, PrivateKey privateKey) {
        try {
            Signature sig = Signature.getInstance("SHA256withRSA");
            sig.initSign(privateKey);
            sig.update(message.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(sig.sign());
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "微信支付签名失败");
        }
    }

    /** 生成指定长度的十六进制随机串。 */
    private String randomHex(int length) {
        byte[] bytes = new byte[length / 2];
        secureRandom.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
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
