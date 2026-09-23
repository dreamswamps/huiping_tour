package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.Order;
import org.huiping.server.entity.UserAddress;

import java.math.BigDecimal;
import java.util.List;

public interface OrderMapper {
    List<Order> selectByUserId(@Param("userId") Long userId);

    Order selectCancelableById(@Param("orderId") Long orderId);

    int insert(Order order);

    Order selectByOrderNo(@Param("orderNo") String orderNo);

    int updateStatusToCancelledByIdAndUserId(@Param("orderId") Long orderId, @Param("userId") Long userId);

    Order selectPendingPaymentByIdAndUserId(@Param("orderId") Long orderId, @Param("userId") Long userId);

    int updateTotal(@Param("orderId") Long orderId, @Param("total") BigDecimal total);

    int updateStatusToPaidByOrderNo(@Param("orderNo") String orderNo);

    int updateStatusByOrderNo(@Param("orderNo") String orderNo, @Param("status") Integer status);

}
