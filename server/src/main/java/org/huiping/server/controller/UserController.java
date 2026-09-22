package org.huiping.server.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.huiping.server.auth.CurrentUserId;
import org.huiping.server.common.Result;
import org.huiping.server.entity.User;
import org.huiping.server.entity.UserAddress;
import org.huiping.server.entity.dto.AddressRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.huiping.server.service.AddressService;
import org.huiping.server.service.UserService;

import java.util.*;

/**
 * FIXME 注意！
 * 受限于转码时不修改小程序代码
 * 理论上路径参数里的userId没有可信度
 * 代码重构将剥离userId 不再参与任何实际业务逻辑包括身份校验
 */
@RestController
@RequestMapping("/api/user")
public class UserController {
    private final UserService userService;
    private final AddressService addressService;

    public UserController(UserService userService, AddressService addressService) {
        this.userService = userService;
        this.addressService = addressService;
    }

    /** 查询当前登录用户资料。 */
    @GetMapping("/profile")
    public Result<User> profile(@CurrentUserId Long userId) {
        return Result.success("获取成功", userService.profile(userId));
    }

    /** 更新当前用户昵称或头像。 */
//    调用频次少的可怜，不必换成DTO
    @PutMapping("/profile")
    public Result<User> updateProfile(@CurrentUserId Long userId,
                                      @RequestBody Map<String, Object> body) {
        return Result.success("更新成功", userService.updateProfile(userId, body));
    }

    /** 查询指定用户的地址列表，仅允许本人访问。 */
    @GetMapping("/{userId}/addresses")
    public Result<List<UserAddress>> addresses(@CurrentUserId Long userId) {
        return Result.success(addressService.list(userId));
    }

    /** 查询指定地址详情，仅允许地址所属用户访问。 */
//    TODO 后续修改小程序代码，顺道把路径参数userId删了
    @GetMapping("/{userId}/addresses/{addressId}")
    public Result<UserAddress> address(@CurrentUserId Long userId,
                                       @PathVariable Long addressId) {
        return Result.success(addressService.get(userId, addressId));
    }

    /** 新增收货地址。 */
    @PostMapping("/{userId}/addresses")
    public Result<UserAddress> addAddress(@CurrentUserId Long userId,
                                          @RequestBody @Valid AddressRequest req) {
        return Result.success("添加成功", addressService.add(userId, req));
    }

    /** 更新收货地址。 */
    @PutMapping("/{userId}/addresses/{addressId}")
    public Result<UserAddress> updateAddress(@CurrentUserId Long userId,
                                             @PathVariable Long addressId,
                                             @RequestBody @Valid AddressRequest req) {
        return Result.success("保存成功", addressService.update(userId, addressId, req));
    }

    /** 删除收货地址。 */
    @DeleteMapping("/{userId}/addresses/{addressId}")
    public Result<String> deleteAddress(@CurrentUserId Long userId,
                                        @PathVariable Long addressId) {
        addressService.delete(userId, addressId);
        return Result.success("已删除");
    }
}
