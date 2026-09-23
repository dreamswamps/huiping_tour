package org.huiping.server.controller;

import jakarta.validation.Valid;
import org.huiping.server.common.Result;
import org.huiping.server.entity.dto.LoginRequest;
import org.huiping.server.service.LoginService;
import org.huiping.server.service.UserService;
import org.huiping.server.util.JwtUtil;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/login")
public class LoginController{
    private final LoginService loginService;
    private final JwtUtil jwtUtil;

    public LoginController(LoginService loginService, JwtUtil jwtUtil) {
        this.loginService = loginService;
        this.jwtUtil = jwtUtil;
    }
    /**
     * 微信登录
     */
    /** 微信登录入口；换取 openid 后由 UserService 查找/创建用户，再签发 JWT。 */
    @PostMapping
    public Result<Map<String, Object>> login(@RequestBody @Valid LoginRequest req) {
//        DTO仅与HTTP有关，不应关联到业务逻辑
        Map<String, Object> user = loginService.login(req.getCode(), req.getNickname(), req.getAvatar());
        String openid = (String) user.get("openid");
        Long id = ((Number) user.get("id")).longValue();
//        TODO 理论上JWT归Service层管，想改就改
        String token = jwtUtil.generateToken(id, openid);

        user.put("token", token);
        return Result.success("登录成功", user);
    }
}
