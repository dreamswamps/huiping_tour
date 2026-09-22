package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProductDetail {
    private Long id;
    @JsonProperty("productId")
    private Long product_id;
    @JsonProperty("productName")
    private String product_name;
    private String subtitle;
    private String description;
    @JsonRawValue
    private String images;
    private String content;
    @JsonRawValue
    private String attrs;
    @JsonProperty("updatedAt")
    private LocalDateTime updated_at;
}
