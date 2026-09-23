package org.huiping.server.controller;

import org.huiping.server.common.Result;
import org.huiping.server.entity.Product;
import org.huiping.server.entity.ProductDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import org.huiping.server.service.ProductService;

@RestController
@RequestMapping("/api/mall")
public class ProductController{
    private final ProductService productService;

    public ProductController(ProductService productService) { this.productService = productService; }

//  注意，以下接口对应的两张表，功能是不一样的

    /**
     * 商城列表 只读products
     */
    @GetMapping("/products")
    public Result<List<Product>> listProducts() {
        return Result.success(productService.listProducts());
    }

    /**
     * 商品详情 只读 product_details
     * 价格需跨表 （保留该接口设计）
     */
    @GetMapping("/product-details")
    public Result<ProductDetail> getProductDetail(@RequestParam(required = false) Long productId) {
        return Result.success(productService.getProductDetail(productId));
    }
}