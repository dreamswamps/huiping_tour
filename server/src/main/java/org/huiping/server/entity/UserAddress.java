package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAddress {
    private Long id;
    @JsonProperty("userId")
    private Long user_id;
    @JsonProperty("receiverName")
    private String receiver_name;
    @JsonProperty("receiverPhone")
    private String receiver_phone;
    private String province;
    private String city;
    private String district;
    @JsonProperty("detailAddress")
    private String detail_address;
    @JsonProperty("postalCode")
    private String postal_code;
    private String label;
    @JsonProperty("isDefault")
    private Integer is_default;
    @JsonProperty("createdAt")
    private LocalDateTime created_at;
    @JsonProperty("updatedAt")
    private LocalDateTime updated_at;
}
