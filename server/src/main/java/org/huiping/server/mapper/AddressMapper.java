package org.huiping.server.mapper;

import org.apache.ibatis.annotations.Param;
import org.huiping.server.entity.UserAddress;

import java.util.List;

public interface AddressMapper {
    List<UserAddress> selectByUserId(@Param("userId") Long userId);
    UserAddress selectByIdAndUserId(@Param("userId") Long userId, @Param("addressId") Long addressId);
    int countByUserId(@Param("userId") Long userId);
    int countDefaultByUserId(@Param("userId") Long userId);
    int clearDefaultByUserId(@Param("userId") Long userId);
    int setDefaultByIdAndUserId(@Param("userId") Long userId, @Param("addressId") Long addressId);
    Long findEarliestExcept(@Param("userId") Long userId, @Param("excludeId") Long excludeId);
    /** 插入地址；写入后通过 address 中的 id 回填自增主键。 */
    int insert(UserAddress address);
    int update(@Param("userId") Long userId, @Param("addressId") Long addressId, @Param("addr") UserAddress addr);
    int delete(@Param("userId") Long userId, @Param("addressId") Long addressId);
    int promoteFirst(@Param("userId") Long userId);
}
