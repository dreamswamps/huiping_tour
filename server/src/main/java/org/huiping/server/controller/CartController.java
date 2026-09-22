package org.huiping.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.entity.Cart;
import org.huiping.server.entity.dto.CartSyncRequest;
import org.huiping.server.exception.ApiException;
import org.huiping.server.service.CartService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mall/cart")
public class CartController {
    private final CartService cartService;

    public CartController(CartService cartService) { this.cartService = cartService; }

    /** 查询当前用户购物车。 */
    @GetMapping
    public Result<List<Cart>> list(@CurrentUserId Long userId){
//        通过拦截器后的userId必定为非null的Long数据
        return Result.success(cartService.list(userId));
    }

    /** 用前端快照覆盖服务端购物车。 */
    @PutMapping("/sync")
    public Result<String> sync(@CurrentUserId Long userId, @RequestBody @Valid CartSyncRequest req) {
        cartService.sync(userId, req.getItems());
        return Result.success( "购物车已同步");
    }
}