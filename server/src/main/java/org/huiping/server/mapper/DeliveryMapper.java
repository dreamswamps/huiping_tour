package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

public interface DeliveryMapper {
    List<Map<String, Object>> findDeliveryOrder(@Param("orderId") Long orderId);
    int markDelivered(@Param("orderId") Long orderId, @Param("trackingNo") String trackingNo);
}
