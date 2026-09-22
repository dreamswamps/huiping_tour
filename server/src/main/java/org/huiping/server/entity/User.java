package org.huiping.server.entity;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 理论上，openid和unionid属于敏感数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {
    private Long id;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String openid;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String unionid;
    private String uid;
    private String nickname;
    private String avatar;
    private Integer score;
    private LocalDateTime created_at;
    private LocalDateTime updated_at;
}
