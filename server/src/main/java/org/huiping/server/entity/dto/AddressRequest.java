package org.huiping.server.entity.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 地址新增/修改入参 (忽略userId路劲参数)
 * DTO仅作长度校验，必填数据由Service层校验
 * POST /api/user/addresses
 * PUT /api/user/addresses/{addressId}
 */
@Data
public class AddressRequest {

    @Size(max = 50, message = "收货人不能超过 50 字")
    private String receiverName;

    @Size(max = 20, message = "电话不能超过 20 字")
    private String receiverPhone;

    @Size(max = 32, message = "省份不能超过 32 字")
    private String province;

    @Size(max = 32, message = "城市不能超过 32 字")
    private String city;

    @Size(max = 32, message = "区县不能超过 32 字")
    private String district;

    @Size(max = 255, message = "详细地址不能超过 255 字")
    private String detailAddress;

    @Size(max = 10, message = "邮编不能超过 10 字")
    private String postalCode;

    @Size(max = 20, message = "标签不能超过 20 字")
    private String label;

    private Boolean isDefault;
}
