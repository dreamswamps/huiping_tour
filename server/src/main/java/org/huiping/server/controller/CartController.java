package org.huiping.server.controller;

import jakarta.validation.Valid;
import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.entity.Cart;
import org.huiping.server.entity.dto.CartSyncRequest;
import org.huiping.server.service.CartService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mall/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) { this.cartService = cartService; }

    /** 查询当前用户购物车。 */
    @GetMapping
    public Result<List<Cart>> listCartItems(@CurrentUserId Long userId){
//        通过拦截器后的userId必定为非null的Long数据
        return Result.success(cartService.listCartItems(userId));
    }

    /** 用前端快照覆盖服务端购物车。 */
    @PutMapping("/sync")
    public Result<String> overwriteCart(@CurrentUserId Long userId, @RequestBody @Valid CartSyncRequest req) {
        cartService.overwriteCart(userId, req.getItems());
        return Result.success( "购物车已同步");
    }
}