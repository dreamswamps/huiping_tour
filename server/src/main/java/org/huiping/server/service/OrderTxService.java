package org.huiping.server.service;

import org.huiping.server.entity.Order;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.CartMapper;
import org.huiping.server.mapper.OrderMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderTxService {
    private final OrderMapper orderMapper;
    private final CartMapper cartMapper;

    public OrderTxService(OrderMapper orderMapper, CartMapper cartMapper) {
        this.orderMapper = orderMapper;
        this.cartMapper = cartMapper;
    }

    /**
     * 下单事务：先插入订单，再清空购物车中对应商品。
     * 通过删除行数判断是否出现并发下同一批商品的情况。
     * 可能的问题场景：连续多个并发请求 -> A 删除购物车 -> B 更新购物车 -> C 删除购物车。
     */
    @Transactional
    public void placeOrder(Order order, List<Long> productIds) {
        orderMapper.insert(order);
        int row = cartMapper.deleteByUserIdAndProductIds(order.getUserId(), productIds);
        if (row != productIds.size()) {
            throw new ApiException(HttpStatus.CONFLICT, "购物车已被其他订单占用，请重新下单");
        }
    }
}
