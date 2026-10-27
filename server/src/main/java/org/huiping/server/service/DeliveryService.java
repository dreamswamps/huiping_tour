package org.huiping.server.service;

import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.DeliveryMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * 订单发货服务（对应 Node 端 utils/deliveryService.js）。
 */
@Service
public class DeliveryService {
    private final DeliveryMapper mapper;
    private final SfDeliveryClient sfDeliveryClient;
    private final boolean defaultMock;

    // 顺丰开放平台寄件人配置
    private final String senderName;
    private final String senderPhone;
    private final String senderProvince;
    private final String senderCity;
    private final String senderDistrict;
    private final String senderAddress;
    private final String monthlyCard;
    private final int defaultWeight;

    public DeliveryService(DeliveryMapper mapper,
                           SfDeliveryClient sfDeliveryClient,
                           @Value("${app.delivery.mock:true}") boolean defaultMock,
                           @Value("${app.delivery.sf-sender-name:红旅薪传}") String senderName,
                           @Value("${app.delivery.sf-sender-phone:}") String senderPhone,
                           @Value("${app.delivery.sf-sender-province:}") String senderProvince,
                           @Value("${app.delivery.sf-sender-city:}") String senderCity,
                           @Value("${app.delivery.sf-sender-district:}") String senderDistrict,
                           @Value("${app.delivery.sf-sender-address:}") String senderAddress,
                           @Value("${app.delivery.sf-monthly-card:}") String monthlyCard,
                           @Value("${app.delivery.sf-default-weight:1000}") int defaultWeight) {
        this.mapper = mapper;
        this.sfDeliveryClient = sfDeliveryClient;
        this.defaultMock = defaultMock;
        this.senderName = senderName == null ? "红旅薪传" : senderName;
        this.senderPhone = senderPhone == null ? "" : senderPhone;
        this.senderProvince = senderProvince == null ? "" : senderProvince;
        this.senderCity = senderCity == null ? "" : senderCity;
        this.senderDistrict = senderDistrict == null ? "" : senderDistrict;
        this.senderAddress = senderAddress == null ? "" : senderAddress;
        this.monthlyCard = monthlyCard == null ? "" : monthlyCard;
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

    /** 真实发货：调用顺丰开放平台新体系下单接口。 */
    private Map<String, Object> realDeliver(Long userId, Long orderId) {
        OrderState state = findOrder(userId, orderId);
        if (state.alreadyDelivered) {
            return alreadyDelivered(state.order);
        }
        Map<String, Object> order = state.order;

        String receiverName = str(order.get("receiver_name"));
        String receiverPhone = str(order.get("receiver_phone"));
        String receiverAddress = str(order.get("detail_address"));
        if (receiverName.isEmpty() || receiverPhone.isEmpty() || receiverAddress.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "订单缺少收件人姓名、手机号或收货地址");
        }

        Map<String, Object> msgData = buildSfOrder(order, receiverName, receiverPhone, receiverAddress);
        String trackingNo;
        try {
            trackingNo = sfDeliveryClient.createOrder(msgData);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            // TODO: 需要人工介入：顺丰下单失败，订单保持 status=1，可再次手动 ship
            throw new ApiException(HttpStatus.BAD_REQUEST, "顺丰发货失败：" + e.getMessage());
        }
        // TODO: 已下单但回写失败的风险点：createOrder 成功而 saveDelivery 失败会导致重复下单，需人工介入
        return saveDelivery(orderId, trackingNo);
    }

    private Map<String, Object> buildSfOrder(Map<String, Object> order, String receiverName,
                                             String receiverPhone, String receiverAddress) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("language", "zh-CN");
        data.put("orderId", str(order.get("orderNo")));
        // TODO: cargoDetails 仍硬编码 1 件/“商品”，后续按 orders.items 真实明细解析
        data.put("cargoDetails", List.of(Map.of("name", "商品", "count", 1)));
        data.put("contactInfoList", List.of(
            sfContact(1, senderName, senderPhone, senderProvince, senderCity, senderDistrict, senderAddress),
            sfContact(2, receiverName, receiverPhone, str(order.get("province")),
                        str(order.get("city")), str(order.get("district")), receiverAddress)));
        data.put("monthlyCard", monthlyCard);
        // TODO: expressTypeId 先用 1，待查《快件产品类别表》
        data.put("expressTypeId", 1);
        data.put("payMethod", 1);
        data.put("totalWeight", defaultWeight / 1000.0);
        data.put("isDocall", 0);
        return data;
    }

    private Map<String, Object> sfContact(int contactType, String name, String phone,
                                          String province, String city, String district, String address) {
        Map<String, Object> contact = new LinkedHashMap<>();
        contact.put("contactType", contactType);
        contact.put("contact", name);
        contact.put("tel", phone);
        contact.put("country", "CN");
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
