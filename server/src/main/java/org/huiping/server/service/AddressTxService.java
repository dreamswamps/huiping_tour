package org.huiping.server.service;

import org.huiping.server.entity.UserAddress;
import org.huiping.server.mapper.AddressMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 地址的事务操作
 * 仅包含必要的写操作
 */
@Service
public class AddressTxService {

    private final AddressMapper addressMapper;

    public AddressTxService(AddressMapper mapper) {
        this.addressMapper = mapper;
    }

    /** 插入地址，并维护"始终存在一个默认地址"。 */
    @Transactional
    public Long insertAndMaintainDefault(Long userId, UserAddress address, boolean isDefault) {
        addressMapper.insert(address);
        Long newId = address.getId();
        if (isDefault) {
            addressMapper.clearDefault(userId);
            addressMapper.setDefault(userId, newId);
        } else if (addressMapper.countDefault(userId) == 0) {
            addressMapper.promoteFirst(userId);
        }
        return newId;
    }

    /** 更新地址，并维护"始终存在一个默认地址"。 */
    @Transactional
    public void updateAndMaintainDefault(Long userId, Long addressId, UserAddress addr, Boolean isDefault) {
        addressMapper.update(userId, addressId, addr);

        // 未提交 isDefault：完全不碰 is_default，直接返回
        if (isDefault == null) {
            return;
        }

        if (isDefault) {
            // 显式设为默认
            addressMapper.clearDefault(userId);
            addressMapper.setDefault(userId, addressId);
            return;
        }

        // 显式取消默认：只有原本是默认时才需要补选
        UserAddress old = addressMapper.findById(userId, addressId);
        boolean wasDefault = old != null && Integer.valueOf(1).equals(old.getIs_default());
        if (!wasDefault) {
            return;
        }

        addressMapper.clearDefault(userId);
        Long pick = addressMapper.findEarliestExcept(userId, addressId);
        if (pick != null) {
            addressMapper.setDefault(userId, pick);
        }
    }

    /** 删除地址，并在删除默认地址后提升最早的一条。 */
    @Transactional
    public void deleteAndPromote(Long userId, Long addressId, boolean wasDefault) {
        addressMapper.delete(userId, addressId);
        if (wasDefault && addressMapper.countDefault(userId) == 0) {
            addressMapper.promoteFirst(userId);
        }
    }
}