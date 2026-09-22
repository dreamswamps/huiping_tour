package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.User;

public interface UserMapper {
    User findByOpenid(@Param("openid") String openid);
    User findProfile(@Param("userId") Long userId);
    String findOpenidByUserId(@Param("userId") Long userId);
    int updateProfile(@Param("userId") Long userId, @Param("nickname") String nickname, @Param("avatar") String avatar);
    int updateUid(@Param("openid") String openid, @Param("uid") String uid);
    int insert(@Param("openid") String openid, @Param("uid") String uid, @Param("nickname") String nickname, @Param("avatar") String avatar);
}
