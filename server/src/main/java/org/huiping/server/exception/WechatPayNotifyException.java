package org.huiping.server.exception;

/**
 * 微信支付回调验签/解密失败异常。
 * 仅用于「回调验签/解密失败」这一场景，其他任何异常不得使用本类。
 */
public class WechatPayNotifyException extends RuntimeException {
    public WechatPayNotifyException(String message, Throwable cause) {
        super(message, cause);
    }
}
