package org.huiping.server.entity.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 快照覆盖购物车
 * 由于小程序传参items外还有一层，需要额外包裹一层CartItem
 * PUT /api/mall/cart/sync
 */
@Data
public class CartSyncRequest {

    @NotEmpty(message = "items 不能为空")
    @Valid
    private List<CartItem> items;
}
