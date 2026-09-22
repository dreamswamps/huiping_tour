package org.huiping.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.DeliveryMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.*;

/**
 * 订单发货服务（对应 Node 端 utils/deliveryService.js）。
 */
// TODO: 发货流程暂未对接，仅保留占位，勿在生产环境调用
@Service
public class DeliveryService {
    private final DeliveryMapper mapper;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestClient restClient = RestClient.create();
    private final boolean defaultMock;

    // 顺丰开放平台配置
    private final String sfUrl;
    private final String sfPartnerId;
    private final String sfCheckword;
    private final String sfServiceName;
    private final String senderName;
    private final String senderPhone;
    private final String senderProvince;
    private final String senderCity;
    private final String senderDistrict;
    private final String senderAddress;
    private final int defaultWeight;

    public DeliveryService(DeliveryMapper mapper,
                           @Value("${app.delivery.mock:true}") boolean defaultMock,
                           @Value("${app.delivery.sf-url:https://sfapi.sf-express.com/std/service}") String sfUrl,
                           @Value("${app.delivery.sf-partner-id:}") String sfPartnerId,
                           @Value("${app.delivery.sf-checkword:}") String sfCheckword,
                           @Value("${app.delivery.sf-service-name:EXP_RECE_CREATE_ORDER}") String sfServiceName,
                           @Value("${app.delivery.sf-sender-name:红旅薪传}") String senderName,
                           @Value("${app.delivery.sf-sender-phone:}") String senderPhone,
                           @Value("${app.delivery.sf-sender-province:}") String senderProvince,
                           @Value("${app.delivery.sf-sender-city:}") String senderCity,
                           @Value("${app.delivery.sf-sender-district:}") String senderDistrict,
                           @Value("${app.delivery.sf-sender-address:}") String senderAddress,
                           @Value("${app.delivery.sf-default-weight:1000}") int defaultWeight) {
        this.mapper = mapper;
        this.defaultMock = defaultMock;
        this.sfUrl = sfUrl == null ? "" : sfUrl;
        this.sfPartnerId = sfPartnerId == null ? "" : sfPartnerId;
        this.sfCheckword = sfCheckword == null ? "" : sfCheckword;
        this.sfServiceName = sfServiceName == null ? "EXP_RECE_CREATE_ORDER" : sfServiceName;
        this.senderName = senderName == null ? "红旅薪传" : senderName;
        this.senderPhone = senderPhone == null ? "" : senderPhone;
        this.senderProvince = senderProvince == null ? "" : senderProvince;
        this.senderCity = senderCity == null ? "" : senderCity;
        this.senderDistrict = senderDistrict == null ? "" : senderDistrict;
        this.senderAddress = senderAddress == null ? "" : senderAddress;
        this.defaultWeight = defaultWeight;
    }

    /** 发货入口：mock 未显式指定时由 MOCK_DELIVERY 配置决定。 */
    public Map<String, Object> deliver(Long userId, Long orderId, Boolean requestedMock) {
        boolean mock = requestedMock != null ? requestedMock : defaultMock;
        return mock ? mockDeliver(userId, orderId) : realDeliver(userId, orderId);
    }

    /** Mock 发货：直接生成演示运单号。 */
    private Map<String, Object> mockDeliver(Long userId, Long orderId) {
        OrderState state = findOrder(userId, orderId);
        if (state.alreadyDelivered) {
            return alreadyDelivered(state.order);
        }
        String trackingNo = "DEMO-" + orderId + "-" + System.currentTimeMillis();
        return saveDelivery(orderId, trackingNo);
    }

    /** 真实发货：调用顺丰开放平台 EXP_RECE_CREATE_ORDER 接口。 */
    private Map<String, Object> realDeliver(Long userId, Long orderId) {
        OrderState state = findOrder(userId, orderId);
        if (state.alreadyDelivered) {
            return alreadyDelivered(state.order);
        }
        Map<String, Object> order = state.order;

        try {
            if (sfUrl.isEmpty() || sfPartnerId.isEmpty() || sfCheckword.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                        "未配置完整的 SF_URL、SF_PARTNER_ID 或 SF_CHECKWORD");
            }

            String receiverName = str(order.get("receiver_name"));
            String receiverPhone = str(order.get("receiver_phone"));
            String receiverAddress = str(order.get("detail_address"));
            if (receiverName.isEmpty() || receiverPhone.isEmpty() || receiverAddress.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "订单缺少收件人姓名、手机号或收货地址");
            }
                    String msgData = objectMapper.writeValueAsString(buildSfOrder(order, receiverName,
                    receiverPhone, receiverAddress));
                    long timestamp = System.currentTimeMillis() / 1000;
                    Map<String, Object> request = new LinkedHashMap<>();
                    request.put("partnerID", sfPartnerId);
                    request.put("requestID", String.valueOf(order.get("orderNo")));
                    request.put("serviceName", sfServiceName);
                    request.put("timestamp", timestamp);
                    request.put("msgDigest", Base64.getEncoder().encodeToString(
                        md5((msgData + timestamp + sfCheckword).getBytes(StandardCharsets.UTF_8))));
                    request.put("msgData", msgData);

                        String formBody = request.entrySet().stream()
                            .map(entry -> URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8) + "="
                                + URLEncoder.encode(String.valueOf(entry.getValue()), StandardCharsets.UTF_8))
                            .reduce((left, right) -> left + "&" + right)
                            .orElse("");
                String responseText = restClient.post()
                    .uri(sfUrl)
                            .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                            .body(formBody)
                    .retrieve()
                    .body(String.class);

                Map<String, Object> body = parseSfResponse(responseText);
                String apiCode = str(body.get("apiResultCode"));
                if (!apiCode.isEmpty() && !"A1000".equals(apiCode)) {
                throw new ApiException(HttpStatus.BAD_REQUEST,
                            "顺丰下单失败：" + firstNonBlank(body.get("apiErrorMsg"), apiCode));
                }
                String trackingNo = getTrackingNo(body);
            if (trackingNo.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "顺丰下单失败：接口未返回运单号");
            }
            return saveDelivery(orderId, trackingNo);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "顺丰发货失败：" + e.getMessage());
        }
    }

        private Map<String, Object> buildSfOrder(Map<String, Object> order, String receiverName,
                                                 String receiverPhone, String receiverAddress) {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("language", "zh-CN");
            data.put("orderId", str(order.get("orderNo")));
            data.put("cargoDetails", List.of(Map.of("cargo", "商品", "count", 1, "weight", defaultWeight)));
            data.put("contactInfoList", List.of(
                sfContact(1, senderName, senderPhone, senderProvince, senderCity, senderDistrict, senderAddress),
                sfContact(2, receiverName, receiverPhone, str(order.get("province")),
                            str(order.get("city")), str(order.get("district")), receiverAddress)));
            return data;
        }

        private Map<String, Object> sfContact(int contactType, String name, String phone,
                                              String province, String city, String district, String address) {
            Map<String, Object> contact = new LinkedHashMap<>();
            contact.put("contactType", contactType);
            contact.put("contact", name);
            contact.put("tel", phone);
            contact.put("province", province);
            contact.put("city", city);
            contact.put("county", district);
            contact.put("address", address);
            return contact;
        }

    /** 查找订单并校验发货权限/状态。 */
    private OrderState findOrder(Long userId, Long orderId) {
        List<Map<String, Object>> rows = mapper.findDeliveryOrder(orderId);
        if (rows.isEmpty()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "订单不存在");
        }
        Map<String, Object> order = rows.get(0);
        if (userId != null && ((Number) order.get("userId")).longValue() != userId) {
            throw new ApiException(HttpStatus.FORBIDDEN, "无权操作此订单");
        }
        int status = ((Number) order.get("status")).intValue();
        if (status == 2) {
            return new OrderState(order, true);
        }
        if (status != 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "当前订单状态不可发货");
        }
        return new OrderState(order, false);
    }

    /** 更新订单为已发货，返回运单号与是否重复发货。 */
    private Map<String, Object> saveDelivery(Long orderId, String trackingNo) {
        int changed = mapper.markDelivered(orderId, trackingNo);
        boolean already = changed == 0;
        return result(trackingNo, already);
    }

    private Map<String, Object> alreadyDelivered(Map<String, Object> order) {
        return result(str(order.get("trackingNo")), true);
    }

    private Map<String, Object> result(String trackingNo, boolean alreadyDelivered) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("trackingNo", trackingNo);
        out.put("alreadyDelivered", alreadyDelivered);
        return out;
    }

    /** 解析顺丰响应，并展开接口返回的 JSON 字符串 msgData。 */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseSfResponse(String text) {
        try {
            Map<String, Object> body = objectMapper.readValue(text, Map.class);
            Object msgData = body.get("msgData");
            if (msgData instanceof String json && !json.isBlank()) {
                body.putAll(objectMapper.readValue(json, Map.class));
            }
            return body;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "顺丰接口返回了无法解析的响应");
        }
    }

    /** 递归查找运单号。 */
    private String getTrackingNo(Object data) {
        if (!(data instanceof Map<?, ?> map)) {
            return "";
        }
        for (String key : List.of("trackingNo", "tracking_no", "waybillNo", "waybill_no", "mailNo", "mail_no")) {
            Object v = map.get(key);
            if (v != null && !String.valueOf(v).isEmpty()) {
                return String.valueOf(v);
            }
        }
        for (Object value : map.values()) {
            String found = getTrackingNo(value);
            if (!found.isEmpty()) {
                return found;
            }
        }
        return "";
    }

    private Object firstNonBlank(Object... values) {
        for (Object v : values) {
            if (v != null && !String.valueOf(v).isEmpty()) {
                return v;
            }
        }
        return null;
    }

    private byte[] md5(byte[] input) {
        try {
            return MessageDigest.getInstance("MD5").digest(input);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "MD5 签名失败");
        }
    }

    private String str(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private static class OrderState {
        final Map<String, Object> order;
        final boolean alreadyDelivered;

        OrderState(Map<String, Object> order, boolean alreadyDelivered) {
            this.order = order;
            this.alreadyDelivered = alreadyDelivered;
        }
    }
}
