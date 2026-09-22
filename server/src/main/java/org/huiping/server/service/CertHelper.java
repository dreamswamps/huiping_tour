package org.huiping.server.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;

/**
 * 证书解密工具（对应 Node 端 utils/certHelper.js）。
 */
@Component
public class CertHelper {

    /** 加密证书的相对路径（相对于项目根目录）。 */
    private final Path encCertPath;
    /** 从环境变量读取解密密码。 */
    private final String secret;

    /** 缓存解密后的证书内容（避免重复解密）。 */
    private String cachedCert;

    public CertHelper(@Value("${app.wechat.pay.private-key-path:certs/apiclient_key.enc}") String path,
                      @Value("${app.wechat.pay.certs-secret:}") String secret) {
        this.encCertPath = Path.of(path);
        this.secret = secret == null ? "" : secret;
    }

    /**
     * 解密证书，返回 PEM 格式的证书字符串。
     */
    public synchronized String decryptCert() {
        // 如果已缓存，直接返回
        if (cachedCert != null) {
            return cachedCert;
        }
        try {
            // 读取加密文件
            byte[] encryptedData = Files.readAllBytes(encCertPath);

            // IV（前16字节）+ 加密数据
            byte[] iv = java.util.Arrays.copyOfRange(encryptedData, 0, 16);
            byte[] encrypted = java.util.Arrays.copyOfRange(encryptedData, 16, encryptedData.length);

            // 从密码派生32字节密钥（SHA-256）
            byte[] key = MessageDigest.getInstance("SHA-256").digest(secret.getBytes(StandardCharsets.UTF_8));

            // 解密
            Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
            byte[] decrypted = cipher.doFinal(encrypted);

            // 转为字符串并缓存
            cachedCert = new String(decrypted, StandardCharsets.UTF_8);
            return cachedCert;
        } catch (Exception e) {
            throw new IllegalStateException("证书解密失败，请检查 CERTS_SECRET 是否正确", e);
        }
    }

    /**
     * 获取微信支付签名所需的私钥对象，供请求签名使用。
     */
    public PrivateKey getPrivateKey() {
        String pem = decryptCert();
        String base64 = pem.replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        try {
            byte[] der = Base64.getDecoder().decode(base64);
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(der));
        } catch (Exception e) {
            throw new IllegalStateException("证书文件不存在或无法读取", e);
        }
    }

    /**
     * 清除缓存（用于热重载场景）。
     */
    public synchronized void clearCache() {
        cachedCert = null;
    }
}
