package org.huiping.server.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.huiping.server.constant.OrderStatus;
import org.huiping.server.entity.Cart;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.Product;
import org.huiping.server.entity.UserAddress;
import org.huiping.server.entity.dto.OrderCreateRequest;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.AddressMapper;
import org.huiping.server.mapper.CartMapper;
import org.huiping.server.mapper.OrderMapper;
import org.huiping.server.mapper.ProductMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.util.*;

@Service
public class OrderService {
    private final OrderTxService orderTxService;
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private final OrderMapper orderMapper;
    private final CartMapper cartMapper;
    private final ProductMapper productMapper;
    private final AddressMapper addressMapper;
    private final SecureRandom random = new SecureRandom();

    public OrderService(OrderTxService orderTxService, OrderMapper orderMapper, CartMapper cartMapper, ProductMapper productMapper, AddressMapper addressMapper) {
        this.orderTxService = orderTxService;
        this.orderMapper = orderMapper;
        this.cartMapper = cartMapper;
        this.productMapper = productMapper;
        this.addressMapper = addressMapper;
    }

    /** 查询当前用户最近 100 条订单。 */
    public List<Order> list(Long userId) {
        return orderMapper.selectByUserId(userId);
    }

    /**
     * 生成订单快照，并删除已下单的购物车行。
     * 缺省 productIds 表示整单购物车；否则仅下单选中的商品。
     */
//    OrderCreateRequest属于DTO，不建议在Service层大量使用DTO，若仅被单一接口调用则可接受
    public Order createOrder(Long userId, OrderCreateRequest req) {
//        读取收货地址
        UserAddress addr = addressMapper.selectByIdAndUserId(userId, req.getAddressId());
        if (addr == null) throw badRequest("收货地址不存在");

//        读取购物车
        List<Cart> carts = cartMapper.selectByUserId(userId);
        List<Long> productIds = req.getProductIds();
//        productIds表选中购买物品，空参则整个购物车下单
        if (!productIds.isEmpty()) {
            Set<Long> idSet = new HashSet<>(productIds);
//            移除无效商品和未选中的商品
            carts.removeIf(c -> c.getProductId() == null || !idSet.contains(c.getProductId()));
        }
        if (carts.isEmpty()) throw badRequest("购物车为空或所选商品不在购物车中");

        // 组装 items 快照：只保留支付/展示需要的字段
        List<Map<String, Object>> items = new ArrayList<>();
        List<Long> validProductIds = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
//        查询次数等于商品数量，目前商品数量较少，暂时可被接受
        for (Cart cart : carts) {
//            不信任前端传参，重新生成订单数据
            long productId = cart.getProductId();
            int quantity = cart.getQuantity() == null ? 1 : cart.getQuantity();
            Product product = productMapper.selectNameAndPriceByProductId(productId, quantity);
            if (product == null) throw badRequest("订单数据异常，请重新下单");

            String name = product.getName() == null ? "" : product.getName();
            BigDecimal price = product.getPrice() == null ? BigDecimal.ZERO : product.getPrice();

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("product_id", productId);
            item.put("name", name);
            item.put("price", price);
            item.put("quantity", quantity);
            items.add(item);
            validProductIds.add(productId);
//            服务端重新计算金额，不信任前端传参金额
            totalAmount = totalAmount.add(price.multiply(BigDecimal.valueOf(quantity)));
        }
//        TODO 建议加入校验，日志记录计算金额与传参金额不符的帐号
        totalAmount = totalAmount.setScale(2, RoundingMode.HALF_UP);

        String orderNo = genOrderNo();
        String itemsJson;
        try {
            itemsJson = MAPPER.writeValueAsString(items);
        } catch (Exception e) {
//            理论上不会触发。HttpStatus.INTERNAL_SERVER_ERROR 为 500，不可调用badRequest
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "订单商品信息异常");
        }
        Order order = new Order();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        order.setAddressId(req.getAddressId());
        order.setReceiverName(addr.getReceiverName());
        order.setReceiverPhone(addr.getReceiverPhone());
        order.setProvince(addr.getProvince());
        order.setCity(addr.getCity());
        order.setDistrict(addr.getDistrict());
        order.setDetailAddress(addr.getDetailAddress());
        order.setItems(itemsJson);
        order.setRemark(req.getRemark());

//        先插入订单再删除
        orderTxService.placeOrder(order, validProductIds);

        return orderMapper.selectByOrderNo(orderNo);
    }

    /**
     * 取消订单：仅待付款(0)、待发货(1) 可取消为已取消(5)。
     */
    public void cancelOrder(Long userId, Long orderId) {
        if (orderId == null || orderId < 1) throw badRequest("无效的订单 id");
        Order order = orderMapper.selectCancelableById(orderId);
        if (order == null || !Objects.equals(order.getUserId(), userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "订单不存在");
        }

        OrderStatus status = OrderStatus.fromCode(order.getStatus());
        if (status == null) {
            throw badRequest("订单状态异常");
        }

        switch (status) {
            case PENDING_PAYMENT, PAID -> {
                // 可取消，继续
            }
            case EXPIRED -> throw badRequest("订单已过期");
            default -> throw badRequest("当前状态不可取消，请联系客服");
        }

        orderMapper.updateStatusToCancelledByIdAndUserId(orderId, userId);
    }

    /** 生成订单号：HPT + 时间戳 base36 + 8 位随机十六进制，截断到 32 位。 */
    private String genOrderNo() {
        String t = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
        String r = String.format("%08X", random.nextInt());
        String raw = "HPT" + t + r;
        return raw.length() <= 32 ? raw : raw.substring(0, 32);
    }

//    HttpStatus.BAD_REQUEST 为 400
    private ApiException badRequest(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, message);
    }
}
