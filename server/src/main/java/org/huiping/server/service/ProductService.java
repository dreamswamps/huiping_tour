package org.huiping.server.service;

import org.huiping.server.entity.Product;
import org.huiping.server.entity.ProductDetail;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.ProductDetailMapper;
import org.huiping.server.mapper.ProductMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    private final ProductMapper productMapper;
    private final ProductDetailMapper productDetailMapper;

    public ProductService(ProductMapper productMapper, ProductDetailMapper productDetailMapper) {
        this.productMapper = productMapper;
        this.productDetailMapper = productDetailMapper;
    }

    public List<Product> listProducts() { return productMapper.selectAll(); }

    public ProductDetail getProductDetail(Long productId) {
        if (productId == null || productId < 1) throw new ApiException(HttpStatus.BAD_REQUEST, "无效或缺少 productId");
        ProductDetail detail = productDetailMapper.selectByProductId(productId);
        if (detail == null) throw new ApiException(HttpStatus.NOT_FOUND, "未找到商品详情");
        return detail;
    }
}
