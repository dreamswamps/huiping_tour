package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.Product;

import java.util.List;

public interface ProductMapper {
    List<Product> findPublished();
    List<Product> findPublishedByIds(@Param("productIds") List<Long> productIds);
    Product findProductById(@Param("productId") Long productId, int quantity);
    int decreaseStock(@Param("productId") Long productId, @Param("quantity") Integer quantity);
}
