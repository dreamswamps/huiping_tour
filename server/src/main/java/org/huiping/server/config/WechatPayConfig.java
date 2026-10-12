package org.huiping.server.config;

import com.wechat.pay.java.core.RSAPublicKeyConfig;
import com.wechat.pay.java.core.notification.NotificationParser;
import com.wechat.pay.java.service.payments.jsapi.JsapiServiceExtension;
import org.huiping.server.service.CertHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;

/**
 * 微信支付官方 Java SDK 配置。
 * 启动时同步校验配置非空；公钥从本地文件加载，无需联网。
 */
@Configuration
public class WechatPayConfig {

    @Bean("wechatPayRSAConfig")
    public RSAPublicKeyConfig wechatPayConfig(CertHelper certHelper,
                                              @Value("${app.wechat.pay.public-key-id:}") String publicKeyId,
                                              @Value("${app.wechat.pay.public-key-path:}") String publicKeyPath,
                                              @Value("${app.wechat.pay.mchid:}") String mchid,
                                              @Value("${app.wechat.pay.serial-no:}") String serialNo,
                                              @Value("${app.wechat.pay.api-v3-key:}") String apiV3Key) {
        requireNonBlank(mchid, "app.wechat.pay.mchid");
        requireNonBlank(serialNo, "app.wechat.pay.serial-no");
        requireNonBlank(apiV3Key, "app.wechat.pay.api-v3-key");
        requireNonBlank(publicKeyId, "app.wechat.pay.public-key-id");
        requireNonBlank(publicKeyPath, "app.wechat.pay.public-key-path");

        // APIv3 密钥固定 32 字节，非 Base64、非任意长度
        if (apiV3Key.getBytes(StandardCharsets.UTF_8).length != 32) {
            throw new IllegalStateException(
                    "app.wechat.pay.api-v3-key 长度必须为 32 字节，当前长度: "
                            + apiV3Key.getBytes(StandardCharsets.UTF_8).length);
        }

        if (!Files.exists(Paths.get(publicKeyPath))) {
            throw new IllegalStateException("微信支付公钥文件不存在: " + publicKeyPath);
        }

        return new RSAPublicKeyConfig.Builder()
                .merchantId(mchid)
                .privateKey(certHelper.getPrivateKey())
                .merchantSerialNumber(serialNo)
                .apiV3Key(apiV3Key)
                .publicKeyId(publicKeyId)
                .publicKeyFromPath(publicKeyPath)
                .build();
    }

    @Bean
    public JsapiServiceExtension jsapiServiceExtension(RSAPublicKeyConfig config) {
        return new JsapiServiceExtension.Builder().config(config).build();
    }

    @Bean
    public NotificationParser notificationParser(RSAPublicKeyConfig config) {
        return new NotificationParser(config);
    }

    private void requireNonBlank(String value, String key) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("微信支付配置缺失: " + key);
        }
    }
}
