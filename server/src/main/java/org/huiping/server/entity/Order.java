package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
// TODO @JsonProperty 在重构前端相关代码时可以一并重构
// TODO 如果在做关于后台的订单管理，需要为发货人的电话和地址做脱敏处理
public class Order {
    private Long id;
    @JsonProperty("orderNo")
    private String order_no;
    @JsonProperty("userId")
    private Long user_id;
    @JsonProperty("totalAmount")
    private BigDecimal total_amount;
    @JsonProperty("addressId")
    private Long address_id;
    @JsonProperty("receiverName")
    private String receiver_name;
    @JsonProperty("receiverPhone")
    private String receiver_phone;
    private String province;
    private String city;
    private String district;
    @JsonProperty("detailAddress")
    private String detail_address;
    private Integer status;
    @JsonProperty("trackingNo")
    private String tracking_no;
    @JsonProperty("payTime")
    private LocalDateTime pay_time;
    @JsonProperty("deliverTime")
    private LocalDateTime deliver_time;
    @JsonProperty("receiveTime")
    private LocalDateTime receive_time;
    @JsonRawValue
    private String items;
    private String remark;
    @JsonProperty("createdAt")
    private LocalDateTime created_at;
    @JsonProperty("updatedAt")
    private LocalDateTime updated_at;
}
