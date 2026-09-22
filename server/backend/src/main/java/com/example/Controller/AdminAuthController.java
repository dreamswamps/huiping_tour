package com.example.Controller;

import com.example.POJO.Admin;
import com.example.POJO.AdminAuth;
import com.example.Service.AdminAuthService;
import com.example.Service.AdminService;
import com.example.Util.Result;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

import java.util.Objects;

@RestController
@RequestMapping
public class AdminAuthController {

    @Resource
    AdminAuthService adminAuthService;
    @Resource
    AdminService adminService;

    @PostMapping("/login")
    public Result login(@RequestBody AdminAuth adminAuth) {
        return Result.success(adminAuthService.Login(adminAuth));
    }

    @PostMapping("/register")
    public Result register(@RequestBody AdminAuth adminAuth) {
        adminAuthService.Register(adminAuth);
        return Result.success();
    }

    @PutMapping("/changepwd")
    public Result changepwd(@RequestBody AdminAuth adminAuth,
                            @RequestHeader("User-ID") Integer Id,
                            @RequestHeader("X-Current-User-ID") Integer currentUserId) {
//        如果当前账号和修改账号的id一样，表示正在修改个人信息，允许修改
        if (!Objects.equals(Id, currentUserId)) {
            adminService.IDAuthManager(currentUserId);
        }
        adminAuth.setAdmin_id(Id);
        adminAuthService.ChangePWD(adminAuth);
        return Result.success("密码修改成功");
    }

    /*
    http://localhost:8081/rolenumberselect
    计算管理员和用户的数量
     */
    @GetMapping("/rolenumberselect")
    public Result RoleNumberSelect() {
        return Result.success(adminAuthService.RoleNumberSelect());
    }

    @PostMapping("/generationtoken")
    public Result generationToken(@RequestBody Admin admin) {
        return Result.success(adminAuthService.generationToken(admin));
    }

    @PostMapping("/verifytoken")
    public Result verifyToken(@RequestBody String token) {
        String token_clear = token.replaceAll("^\"|\"$", "");
        return Result.success(adminAuthService.verifyToken(token_clear));
    }

    /*
    邮箱账号验证，用于实现邮箱验证密码重置
     */
    @PostMapping("/email-verify")
    public Result emailVerify(@RequestParam String username, @RequestParam String email) {
        return Result.success(adminAuthService.emailVerify(username, email));
    }

    /*
    该接口也用于修改密码，但是用于通过邮箱验证后的密码重置。
    为保护数据，在该接口重置密码时，再进行一次邮箱账号验证
     */
    @PostMapping("/email-resetpwd")
    public Result emailResetPwd(@RequestBody AdminAuth adminAuth) {
        if (adminAuthService.emailVerify(adminAuth.getUsername(), adminAuth.getEmail())) {
            return Result.success(adminAuthService.emailResetPwd(adminAuth.getUsername(), adminAuth.getPwd()));
        }
        return Result.error("500","数据异常，拒绝访问");
    }
}
