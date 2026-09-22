package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.Cart;
import org.huiping.server.entity.dto.CartItem;

import java.util.List;

public interface CartMapper {
    List<Cart> findByUserId(@Param("userId") Long userId);
    int deleteByUserId(@Param("userId") Long userId);
    int deleteByProductIds(@Param("userId") Long userId, @Param("productIds") List<Long> productIds);
    int insertBatch(@Param("userId") Long userId, @Param("items") List<CartItem> items);
}
