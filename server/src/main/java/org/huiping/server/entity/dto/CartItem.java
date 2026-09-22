package org.huiping.server.entity.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 购物车中的商品DTO
 * 数据格式参照syncPayload
 */
@Data
public class CartItem {

    @NotNull(message = "productId 不能为空")
    private Long productId;

    @NotNull(message = "商品名称 不能为空")
    @Size(max = 100, message = "商品名称过长")
    private String name;

    @NotNull(message = "价格 不能为空")
    @DecimalMin(value = "0", message = "价格数据非法")
    private BigDecimal price;

    @Size(max = 512, message = "缩略图过长")
    private String thumb;

    @NotNull(message = "数量 不能为空")
    @Min(value = 1, message = "数量至少为1")
    @Max(value = 99, message = "数量最大为99")
    private Integer quantity;
}
