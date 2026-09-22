package org.huiping.server.service;

import org.huiping.server.entity.UserAddress;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.CartMapper;
import org.huiping.server.mapper.OrderMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderTxService {
    private final OrderMapper orderMapper;
    private final CartMapper cartMapper;

    public OrderTxService(OrderMapper orderMapper, CartMapper cartMapper) {
        this.orderMapper = orderMapper;
        this.cartMapper = cartMapper;
    }

    @Transactional
    public void insertAndClearCart(String orderNo, Long userId, BigDecimal total,
                                   Long addressId, UserAddress addr, String itemsJson,
                                   String remark, List<Long> pids) {
        orderMapper.insert(orderNo, userId, total, addressId, addr, itemsJson, remark);
        int row = cartMapper.deleteByProductIds(userId, pids);
//        通过判断清除购物车表数据影响行数判断，是否出现并发操作，有其他操作先添加购物车
//        该校验可能出现问题的场景： 连续多个并发请求 -> 线程A删除购物车 -> 线程B更新购物车 -> 线程C删除购物车
        if (row != pids.size()) {
            throw new ApiException(HttpStatus.CONFLICT, "购物车已被其他订单占用，请重新下单");
        }
    }
}
