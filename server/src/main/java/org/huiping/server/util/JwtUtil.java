package org.huiping.server.util;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Date;

@Component
public class JwtUtil {
    private final SecretKey secretKey;
    private final Duration expiresIn;

    public JwtUtil(@Value("${app.jwt.secret}") String secret,
                   @Value("${app.jwt.expires-in:30d}") String expires) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException("未找到JWT密钥");
        }
//        默认密钥为32位，不校验。不是32位想想是不是自己有问题
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiresIn = parseDuration(expires);
    }

    /** 签发 JWT，载荷含 userId 与 openid。 */
    public String generateToken(Long userId, String openid) {
        return Jwts.builder()
                .claim("userId", userId)
                .claim("openid", openid)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiresIn.toMillis()))
                .signWith(secretKey)
                .compact();
    }

    /** 解析 Node 端使用的 30d、12h 或纯秒数格式。 */
    private Duration parseDuration(String value) {
        try {
            if (value.endsWith("d")) {
                return Duration.ofDays(Long.parseLong(value.substring(0, value.length() - 1)));
            }
            if (value.endsWith("h")) {
                return Duration.ofHours(Long.parseLong(value.substring(0, value.length() - 1)));
            }
            return Duration.ofSeconds(Long.parseLong(value));
        } catch (Exception e) {
//            TODO 日志记录app.jwt.expires-in解析失败
            return Duration.ofDays(30);
        }
    }
}
