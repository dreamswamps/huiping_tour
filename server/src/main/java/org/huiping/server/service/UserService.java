package org.huiping.server.service;

import org.huiping.server.entity.User;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.UserMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class UserService {
    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    /** 查询当前用户资料。 */
    public User profile(Long userId) {
        User user = userMapper.findProfile(userId);
        if (user == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "用户不存在");
        }
        return user;
    }

    /** 仅更新请求中提供的用户资料字段（昵称截断 100，头像截断 512）。 */
    public User updateProfile(Long userId, Map<String, Object> body) {
//        由于调用次数过少，暂时不管静默截断的问题
        String nickname = body.get("nickname") instanceof String value && !value.trim().isEmpty()
                ? truncate(value.trim(), 100) : null;
        String avatar = body.get("avatar") instanceof String value ? truncate(value, 512) : null;
        if (nickname == null && avatar == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "没有需要更新的字段");
        }
        User current = profile(userId);
        if (nickname == null) nickname = current.getNickname();
        if (avatar == null) avatar = current.getAvatar();
        userMapper.updateProfile(userId, nickname, avatar);
        return profile(userId);
    }

    private String truncate(String s, int max) {
        return s.substring(0, Math.min(max, s.length()));
    }
}