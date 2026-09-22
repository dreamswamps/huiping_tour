package org.huiping.server.service;

import org.huiping.server.entity.Cart;
import org.huiping.server.entity.dto.CartItem;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.CartMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class CartService {
    private final CartMapper cartMapper;

    public CartService(CartMapper cartMapper) {
        this.cartMapper = cartMapper;
    }

    /**
     * 当前用户购物车（读 carts 表）。
     */
    public List<Cart> list(Long userId) {
        return cartMapper.findByUserId(userId);
    }

    /**
     * 用前端快照覆盖服务端购物车（与本地 cart 对齐，写入 carts 表）。
     * 以事务方式先删后插，避免删除成功后插入失败造成半套数据。
     */
//    CartItem属于DTO，不建议在Service层大量使用DTO，若仅被单一接口调用则可接受
//    已经是很原子化的事务操作，不需要分离至TxService里
    @Transactional
    public void sync(Long userId, List<CartItem> items) {
        cartMapper.deleteByUserId(userId);
//        空购物车理论上属于正常业务，但也会导致数据库操作失败
        if (!items.isEmpty()) {
            cartMapper.insertBatch(userId, items);
        }
    }
}