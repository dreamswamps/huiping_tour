package org.huiping.server.service;

import org.huiping.server.exception.BizException;
import org.huiping.server.mapper.OrderMapper;
import org.huiping.server.mapper.ProductMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * 微信支付的事务操作
 */
@Service
public class PaymentTxService {
    private final OrderMapper orderMapper;
    private final ProductMapper productMapper;

    public PaymentTxService(OrderMapper mapper, ProductMapper productMapper) {
        this.orderMapper = mapper;
        this.productMapper = productMapper;
    }

    /**
     * 扣商品库存+修改订单状态
     */
    @Transactional(rollbackFor = Exception.class, timeout = 3)
    public void deductStockAndMarkPaid(String orderNo, List<Map<String, Object>> items) {
//        优先抢订单修改为已支付，cos乐观锁
        int row = orderMapper.updateStatusToPaidByOrderNo(orderNo);
        if (row == 0) return;

        items.sort(Comparator.comparingLong(
                i -> ((Number) i.get("product_id")).longValue()
        ));

        for (Map<String, Object> item : items) {
            long pid = ((Number) item.get("product_id")).longValue();
            int qty = ((Number) item.get("quantity")).intValue();

            if (productMapper.decreaseStock(pid, qty) == 0) {
                // 商品不存在 / 已下架 / 库存不足，抛异常回滚
                // 对应的操作在事务操作外层catch，再进行处理
                throw new BizException(6, "商品ID " + pid + "库存不足或已下架");
            }
        }
    }
}
