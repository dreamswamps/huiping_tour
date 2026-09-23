package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.User;

public interface UserMapper {
    User selectByOpenid(@Param("openid") String openid);
    User selectByUserId(@Param("userId") Long userId);
    String selectOpenidByUserId(@Param("userId") Long userId);
    int updateProfileByUserId(@Param("userId") Long userId, @Param("nickname") String nickname, @Param("avatar") String avatar);
    int updateUidByOpenId(@Param("openid") String openid, @Param("uid") String uid);
    int insert(@Param("openid") String openid, @Param("uid") String uid, @Param("nickname") String nickname, @Param("avatar") String avatar);
}
