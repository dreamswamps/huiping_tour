package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonRawValue;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)   // 只作用于本类
public class Order {
    private Long id;
    private String orderNo;              // -> order_no
    private Long userId;                 // -> user_id
    private BigDecimal totalAmount;      // -> total_amount
    private Long addressId;              // -> address_id
    private String receiverName;         // -> receiver_name
    private String receiverPhone;        // -> receiver_phone
    private String province;
    private String city;
    private String district;
    private String detailAddress;        // -> detail_address
    private Integer status;
    private String trackingNo;           // -> tracking_no
    private LocalDateTime payTime;       // -> pay_time
    private LocalDateTime deliverTime;   // -> deliver_time
    private LocalDateTime receiveTime;   // -> receive_time
    @JsonRawValue
    private String items;
    private String remark;
    private LocalDateTime createdAt;     // -> created_at
    private LocalDateTime updatedAt;     // -> updated_at
}