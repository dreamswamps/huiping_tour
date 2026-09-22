package org.huiping.server.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 微信登录入参
 * POST /api/login
 */
@Data
public class LoginRequest {

    @NotBlank(message = "code 不能为空")
    private String code;

    @Size(max = 100, message = "昵称过长")
    private String nickname;

    @Size(max = 512, message = "用户头像过长")
    private String avatar;
}
