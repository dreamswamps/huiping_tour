package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.UserAddress;

import java.math.BigDecimal;
import java.util.List;

public interface OrderMapper {
    List<Order> findByUserId(@Param("userId") Long userId);

    Order findOrderCancelable(@Param("orderId") Long orderId);

    int insert(@Param("orderNo") String orderNo, @Param("userId") Long userId, @Param("total") BigDecimal total, @Param("addressId") Long addressId, @Param("address") UserAddress address, @Param("items") String items, @Param("remark") String remark);

    Order findByOrderNo(@Param("orderNo") String orderNo);

    int updateCancel(@Param("orderId") Long orderId, @Param("userId") Long userId);

    Order findPendingOrder(@Param("orderId") Long orderId, @Param("userId") Long userId);

    int updateOrderTotal(@Param("orderId") Long orderId, @Param("total") BigDecimal total);

    int markPaid(@Param("orderNo") String orderNo);

    int markFailure(@Param("orderNo") String orderNo, @Param("status") Integer status);

}
