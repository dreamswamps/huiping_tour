package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.ProductDetail;

public interface ProductDetailMapper {
    ProductDetail findDetail(@Param("productId") Long productId);
}
