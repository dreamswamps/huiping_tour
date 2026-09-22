package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Cart {
    private Long id;
    @JsonProperty("userId")
    private Long user_id;
    @JsonProperty("productId")
    private Long product_id;
    @JsonProperty("productName")
    private String product_name;
    @JsonProperty("productPrice")
    private BigDecimal product_price;
    @JsonProperty("productThumb")
    private String product_thumb;
    private Integer quantity;
    @JsonProperty("createdAt")
    private LocalDateTime created_at;
    @JsonProperty("updatedAt")
    private LocalDateTime updated_at;
}
