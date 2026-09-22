package org.huiping.server.constant;

import lombok.Getter;

/**
 * 订单状态 可查看数字对应的意思
 * code 关联数据库 order表 status字段
 */
@Getter
public enum OrderStatus {

    PENDING_PAYMENT(0, "待支付"),
    PAID(1, "已支付"),
    // 2/3/4 物流状态待开发，先占位或暂不定义
    EXPIRED(5, "已过期"),
    PAY_FAIL_OFFLINE(6, "商品下架或不足"),
    PAY_FAIL_CONN(8, "数据库操作失败"),
    IN_PROGRESS(10,"处理中");


    private final int code;
    private final String label;

    OrderStatus(final int code, final String label) {
        this.code = code;
        this.label = label;
    }

    //    根据code枚举，未知则返回null
    public static OrderStatus fromCode(Integer code) {
        if (code == null) return null;
//        values()属于内部静态方法，返回所有常量数组
        for (OrderStatus status : values()) {
            if (status.code == code) return status;
        }
        return null;
    }
}
