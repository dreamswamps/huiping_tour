package org.huiping.server.entity.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

/**
 * 生成订单入参
 * POST /api/mall/orders
 */
@Data
public class OrderCreateRequest {
    @NotNull(message = "addressId 不能为空")
    @Positive
    private Long addressId;

    private List<Long> productIds;

    private String remark;
}
