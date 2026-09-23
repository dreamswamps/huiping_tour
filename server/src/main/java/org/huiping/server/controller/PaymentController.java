package org.huiping.server.controller;

import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController{
    private final PaymentService paymentService;
    public PaymentController(PaymentService paymentService) { this.paymentService = paymentService; }

    /**
     * 校验订单商品并创建微信支付参数
     */
    @PostMapping("/pay")
    public Result<Map<String, Object>> createWechatPayment(@CurrentUserId Long userId,
                                                           @RequestBody Map<String, Object> body) {
        Long orderId = body.get("orderId") instanceof Number value ? value.longValue() : null;
        return Result.success(paymentService.createWechatPayment(userId, orderId));
    }

    /**
     * 微信支付完成的回调接口callback(官方叫通知notify)
     * 注意，微信有固定的回调参数结构，不可进行封装
     * 微信会尝试最多15次直到回参为成功。该成功值回调success，不是业务逻辑的成功。
     * 即使出现业务失败，也要回参success
     */
    @PostMapping("/callback")
    public Map<String, Object> receiveWechatPaymentNotify(@RequestBody Map<String, Object> body) {
        String orderNo = body.get("out_trade_no") instanceof String value ? value : null;
        if (orderNo == null || orderNo.isBlank()) {
            return Map.of("code", "FAIL", "message", "订单号缺失");
        }
//        微信支付需要200的状态码，默认的状态码是200
        return paymentService.receiveWechatPaymentNotify(orderNo);
    }
}