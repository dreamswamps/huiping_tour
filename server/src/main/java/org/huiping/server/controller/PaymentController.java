package org.huiping.server.controller;

import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.exception.WechatPayNotifyException;
import org.huiping.server.service.PaymentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {
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
     * 微信支付回调（官方称通知）。微信有固定回调结构：raw body + 4 个 header，不封装。
     * 验签/解密失败返回 401 让微信重试；业务处理结果返回 200（含 SUCCESS）。
     */
    @PostMapping("/callback")
    public ResponseEntity<Map<String, Object>> receiveWechatPaymentNotify(
            @RequestBody String body,
            @RequestHeader(value = "Wechatpay-Timestamp", required = false) String timestamp,
            @RequestHeader(value = "Wechatpay-Nonce", required = false) String nonce,
            @RequestHeader(value = "Wechatpay-Signature", required = false) String signature,
            @RequestHeader(value = "Wechatpay-Serial", required = false) String serial) {
        if (isBlank(timestamp) || isBlank(nonce) || isBlank(signature) || isBlank(serial)) {
            return fail("微信支付回调报文头缺失");
        }
        try {
            return ResponseEntity.ok(paymentService.receiveWechatPaymentNotify(
                    body, timestamp, nonce, signature, serial));
        } catch (WechatPayNotifyException e) {
            return fail("微信支付回调验签或解密失败");
        } catch (Exception e) {
            // TODO: 需要日志记录未预期异常，当前无日志，微信将重试
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("code", "FAIL", "message", "微信支付回调处理失败"));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private ResponseEntity<Map<String, Object>> fail(String message) {
        Map<String, Object> body = Map.of("code", "FAIL", "message", message);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }
}
