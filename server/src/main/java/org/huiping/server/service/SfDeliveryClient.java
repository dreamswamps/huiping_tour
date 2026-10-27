package org.huiping.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 顺丰开放平台新体系客户端（open.sf-express.com）。
 * 鉴权：partnerID + secret + grantType=password 换取 accessToken，带缓存与提前刷新；
 * 下单：通过 accessToken 调用 std/service，不再使用丰桥旧体系 checkword + md5(msgDigest)。
 */
@Component
public class SfDeliveryClient {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();

    private final String partnerId;
    private final String clientSecret;
    private final String accessTokenUrl;
    private final String serviceUrl;
    private final String sandboxUrl;
    private final boolean useSandbox;
    private final String serviceCode;

    private volatile String cachedAccessToken;
    private volatile long accessTokenExpiresAt;

    public SfDeliveryClient(
            @Value("${app.delivery.sf-partner-id:}") String partnerId,
            @Value("${app.delivery.sf-client-secret:}") String clientSecret,
            @Value("${app.delivery.sf-access-token-url:}") String accessTokenUrl,
            @Value("${app.delivery.sf-url:}") String serviceUrl,
            @Value("${app.delivery.sf-url-sandbox:}") String sandboxUrl,
            @Value("${app.delivery.sf-use-sandbox:true}") boolean useSandbox,
            @Value("${app.delivery.sf-service-name:EXP_RECE_CREATE_ORDER}") String serviceCode) {
        this.partnerId = partnerId == null ? "" : partnerId;
        this.clientSecret = clientSecret == null ? "" : clientSecret;
        this.accessTokenUrl = accessTokenUrl == null ? "" : accessTokenUrl;
        this.serviceUrl = serviceUrl == null ? "" : serviceUrl;
        this.sandboxUrl = sandboxUrl == null ? "" : sandboxUrl;
        this.useSandbox = useSandbox;
        this.serviceCode = serviceCode == null ? "EXP_RECE_CREATE_ORDER" : serviceCode;
    }

    /**
     * 下单：返回运单号。异常时抛出 {@link IllegalStateException}（含可读信息）。
     * TODO: 需要接入真实顺丰开放平台凭据（partnerId/secret），当前沙箱联调用环境变量提供
     */
    public String createOrder(Map<String, Object> msgData) {
        requireCredential(partnerId, "SF_PARTNER_ID");
        requireCredential(clientSecret, "SF_CLIENT_SECRET");
        requireCredential(resolveServiceUrl(), "SF_URL_SANDBOX");

        String accessToken = getAccessToken();
        String msgDataJson = writeJson(msgData);
        String requestId = UUID.randomUUID().toString();

        Map<String, Object> form = new LinkedHashMap<>();
        form.put("partnerID", partnerId);
        form.put("requestID", requestId);
        form.put("serviceCode", serviceCode);
        form.put("timestamp", System.currentTimeMillis());
        form.put("accessToken", accessToken);
        form.put("msgData", msgDataJson);

        String responseText = restClient.post()
                .uri(resolveServiceUrl())
                .contentType(MediaType.parseMediaType("application/x-www-form-urlencoded;charset=UTF-8"))
                .body(toFormBody(form))
                .retrieve()
                .body(String.class);

        Map<String, Object> body = readJson(responseText);
        String apiCode = str(body.get("apiResultCode"));
        if (!"A1000".equals(apiCode)) {
            throw new IllegalStateException("顺丰下单平台调用失败：" + firstNonBlank(body.get("apiErrorMsg"), apiCode));
        }
        Map<String, Object> data = unwrapMap(body.get("apiResultData"));
        boolean success = "true".equals(String.valueOf(data.get("success")));
        if (!success) {
            throw new IllegalStateException("顺丰下单业务失败：" + firstNonBlank(data.get("errorMsg"), data.get("errorCode")));
        }
        String waybillNo = extractWaybillNo(data);
        if (waybillNo.isEmpty()) {
            throw new IllegalStateException("顺丰下单失败：接口未返回运单号");
        }
        return waybillNo;
    }

    /** 获取 accessToken：带缓存，提前 60 秒刷新，expiresIn 默认 7200 秒。 */
    private String getAccessToken() {
        long now = System.currentTimeMillis();
        if (cachedAccessToken != null && now < accessTokenExpiresAt) {
            return cachedAccessToken;
        }
        synchronized (this) {
            if (cachedAccessToken != null && now < accessTokenExpiresAt) {
                return cachedAccessToken;
            }
            requireCredential(accessTokenUrl, "SF_ACCESS_TOKEN_URL");
            Map<String, Object> form = new LinkedHashMap<>();
            form.put("partnerID", partnerId);
            form.put("secret", clientSecret);
            form.put("grantType", "password");

            String responseText = restClient.post()
                    .uri(accessTokenUrl)
                    .contentType(MediaType.parseMediaType("application/x-www-form-urlencoded;charset=UTF-8"))
                    .body(toFormBody(form))
                    .retrieve()
                    .body(String.class);
            Map<String, Object> body = readJson(responseText);
            String apiCode = str(body.get("apiResultCode"));
            if (!"A1000".equals(apiCode)) {
                throw new IllegalStateException("获取顺丰 accessToken 失败：" + firstNonBlank(body.get("apiErrorMsg"), apiCode));
            }
            String token = str(body.get("accessToken"));
            if (token.isEmpty()) {
                throw new IllegalStateException("获取顺丰 accessToken 失败：响应缺少 accessToken");
            }
            long expiresIn = number(body.get("expiresIn")).longValue();
            if (expiresIn <= 0) {
                expiresIn = 7200; // 默认 2 小时
            }
            long ttlMs = (expiresIn > 60 ? expiresIn - 60 : expiresIn) * 1000L;
            cachedAccessToken = token;
            accessTokenExpiresAt = now + ttlMs;
            return token;
        }
    }

    /** 当前只启用沙箱；生产地址 https://bspgw.sf-express.com/std/service 暂未启用。 */
    private String resolveServiceUrl() {
        // TODO: 生产环境地址暂未启用，当前固定走沙箱
        return useSandbox ? sandboxUrl : serviceUrl;
    }

    private void requireCredential(String value, String key) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("顺丰开放平台配置缺失: " + key);
        }
    }

    private String toFormBody(Map<String, Object> form) {
        return form.entrySet().stream()
                .map(e -> URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8) + "="
                        + URLEncoder.encode(String.valueOf(e.getValue()), StandardCharsets.UTF_8))
                .reduce((a, b) -> a + "&" + b)
                .orElse("");
    }

    private String writeJson(Map<String, Object> data) {
        try {
            return objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            throw new IllegalStateException("顺丰下单报文序列化失败", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> readJson(String text) {
        try {
            Object parsed = objectMapper.readValue(text, Map.class);
            return parsed == null ? Map.of() : (Map<String, Object>) parsed;
        } catch (Exception e) {
            throw new IllegalStateException("顺丰接口返回无法解析的响应", e);
        }
    }

    /** apiResultData 可能是对象，也可能是 JSON 字符串，统一展开为 Map。 */
    @SuppressWarnings("unchecked")
    private Map<String, Object> unwrapMap(Object v) {
        if (v instanceof Map<?, ?> m) {
            return (Map<String, Object>) m;
        }
        if (v instanceof String s) {
            try {
                Object parsed = objectMapper.readValue(s, Map.class);
                return parsed == null ? Map.of() : (Map<String, Object>) parsed;
            } catch (Exception e) {
                return Map.of();
            }
        }
        return Map.of();
    }

    /** 运单号路径：apiResultData.msgData.waybillNoInfoList[0].waybillNo */
    private String extractWaybillNo(Map<String, Object> data) {
        Map<String, Object> msg = unwrapMap(data.get("msgData"));
        Object list = msg.get("waybillNoInfoList");
        if (list instanceof java.util.List<?> l && !l.isEmpty() && l.get(0) instanceof Map<?, ?> m) {
            Object wn = m.get("waybillNo");
            return wn == null ? "" : String.valueOf(wn);
        }
        return "";
    }

    private Number number(Object v) {
        if (v instanceof Number n) {
            return n;
        }
        if (v != null) {
            try {
                return Long.parseLong(String.valueOf(v));
            } catch (NumberFormatException ignored) {
                // fall through
            }
        }
        return 0L;
    }

    private String firstNonBlank(Object... values) {
        for (Object v : values) {
            if (v != null && !String.valueOf(v).isEmpty()) {
                return String.valueOf(v);
            }
        }
        return "";
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }
}
