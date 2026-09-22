package org.huiping.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.dto.OrderCreateRequest;
import org.springframework.web.bind.annotation.*;
import org.huiping.server.service.OrderService;
import org.huiping.server.service.DeliveryService;

import java.util.*;

@RestController
@RequestMapping("/api/mall/orders")
//  TODO ApiController应该被逐步剥离，不过发货还在开发，等待发货开发完整再删除继承
//  TODO 已发货delivery应该作为单独的Controller层，并以物流logistics命名，同步修改Service层
public class OrderController {
    private final OrderService orderService;
    private final DeliveryService deliveryService;

    public OrderController(OrderService orderService, DeliveryService deliveryService) {
        this.orderService = orderService;
        this.deliveryService = deliveryService; }

    /**
     * 从购物车创建待支付订单。
     * 该接口存在约束背景，由于传参req属于前端传参，可同个修改入参的方式修改商品和金额
     * 该接口不信任前端传递的金额和商品数据，但信任商品id
     * */
    @PostMapping
    public Result<Object> create(@CurrentUserId Long userId,
                         @RequestBody @Valid OrderCreateRequest req) {
        return Result.success(orderService.create(userId, req));
    }

    /**
     * 查询当前用户最近的订单。
     */
    @GetMapping
    public Result<List<Order>> list(@CurrentUserId Long userId) {
        return Result.success(orderService.list(userId));
    }

    /**
     * 取消待付款或待发货订单。
     */
    @PostMapping("/{id}/cancel")
    public Result<String> cancel(@CurrentUserId Long userId,
                                 @PathVariable Long id) {
        orderService.cancelOrder(userId, id);
        return Result.success("已取消订单");
    }

//    TODO 发货还在写！！！！！！！！！别改
    /**
     * 为待发货订单生成运单号并推进到已发货状态。
     */
    @PostMapping("/{id}/ship")
    public Result<Map<String, Object>> ship(@CurrentUserId Long userId,
                                            @PathVariable Long id,
                                            @RequestBody(required = false) Map<String, Object> body) {
        Boolean mock = body != null && body.get("mock") instanceof Boolean value ? value : null;
        Map<String, Object> result = deliveryService.deliver(userId, id, mock);
        String message = Boolean.TRUE.equals(result.get("alreadyDelivered"))
                ? "订单已发货，无需重复操作" : "发货成功";
        return Result.success(message, Map.of("trackingNo", result.get("trackingNo")));
    }
}