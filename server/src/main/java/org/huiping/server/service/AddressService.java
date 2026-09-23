package org.huiping.server.service;

import org.huiping.server.entity.UserAddress;
import org.huiping.server.entity.dto.AddressRequest;
import org.huiping.server.exception.ApiException;
import org.huiping.server.mapper.AddressMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AddressService {

    private final AddressMapper addressMapper;
    private final AddressTxService txService;

    public AddressService(AddressMapper mapper, AddressTxService txService) {
        this.addressMapper = mapper;
        this.txService = txService;
    }

    /** 查询用户地址，并按默认地址优先返回。 */
    public List<UserAddress> listAddress(Long userId) {
        return addressMapper.selectByUserId(userId);
    }

    /** 查询用户自己的地址，避免通过地址 ID 越权访问他人数据。 */
    public UserAddress getAddressDetail(Long userId, Long addressId) {
        UserAddress addr = addressMapper.selectByIdAndUserId(userId, addressId);
        if (addr == null) {
            throw missing();
        }
        return addr;
    }

    /** 新增地址；第一个地址自动成为默认地址。 */
    public UserAddress addAddress(Long userId, AddressRequest req) {
        String receiverName = trim(req.getReceiverName(), 50);
        String receiverPhone = trim(req.getReceiverPhone(), 20);
        String province = trim(req.getProvince(), 32);
        String city = trim(req.getCity(), 32);
        String district = trim(req.getDistrict(), 32);
        String detailAddress = trim(req.getDetailAddress(), 255);
        String postalCode = nullable(req.getPostalCode(), 10);
        String label = nullable(req.getLabel(), 20);
        validate(receiverName, receiverPhone, province, city, district, detailAddress);

        boolean isDefault = truthy(req.getIsDefault());
        if (addressMapper.countByUserId(userId) == 0) {
            isDefault = true;
        }

        UserAddress address = new UserAddress();
        address.setUserId(userId);
        addressBuilder(receiverName, receiverPhone, province, city, district, detailAddress, postalCode, label, address);
        address.setIsDefault(0);

        Long newId = txService.insertAndMaintainDefault(userId, address, isDefault);
        return getAddressDetail(userId, newId);
    }

    /** 更新地址；未提交的字段保留原值。 */
    public UserAddress updateAddress(Long userId, Long addressId, AddressRequest req) {
        UserAddress old = getAddressDetail(userId, addressId);

        String receiverName = valueOrOld(req.getReceiverName(), old.getReceiverName(), 50);
        String receiverPhone = valueOrOld(req.getReceiverPhone(), old.getReceiverPhone(), 20);
        String province = valueOrOld(req.getProvince(), old.getProvince(), 32);
        String city = valueOrOld(req.getCity(), old.getCity(), 32);
        String district = valueOrOld(req.getDistrict(), old.getDistrict(), 32);
        String detailAddress = valueOrOld(req.getDetailAddress(), old.getDetailAddress(), 255);
        validate(receiverName, receiverPhone, province, city, district, detailAddress);
        String postalCode = valueOrExisting(req.getPostalCode(), old.getPostalCode(), 10);
        String label = valueOrExisting(req.getLabel(), old.getLabel(), 20);

        UserAddress addr = new UserAddress();
        addressBuilder(receiverName, receiverPhone, province, city, district, detailAddress, postalCode, label, addr);

        Boolean isDefault = req.getIsDefault();
        txService.updateAndMaintainDefault(userId, addressId, addr, isDefault);
        return getAddressDetail(userId, addressId);
    }

    /** 删除地址；删除默认地址后自动提升最早的一条地址。 */
    public void deleteAddress(Long userId, Long addressId) {
        UserAddress old = getAddressDetail(userId, addressId);
        txService.deleteAndPromote(userId, addressId, truthy(old.getIsDefault()));
    }

    private void validate(String receiverName, String receiverPhone, String province,
                          String city, String district, String detailAddress) {
        if (receiverName.isEmpty() || receiverPhone.isEmpty() || province.isEmpty()
                || city.isEmpty() || district.isEmpty() || detailAddress.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "请填写完整的收货信息");
        }
    }

    private ApiException missing() {
        return new ApiException(HttpStatus.NOT_FOUND, "地址不存在");
    }

    private boolean truthy(Object value) {
        return Boolean.TRUE.equals(value) || "1".equals(String.valueOf(value));
    }

    private String trim(String value, int max) {
        if (value == null) return "";
        String result = value.trim();
        return result.substring(0, Math.min(max, result.length()));
    }

    private String nullable(String value, int max) {
        if (value == null || value.trim().isEmpty()) return null;
        String result = value.trim();
        return result.substring(0, Math.min(max, result.length()));
    }

    private String valueOrOld(String value, Object old, int max) {
        String result = value != null ? value.trim() : String.valueOf(old);
        return result.substring(0, Math.min(max, result.length()));
    }

    private String valueOrExisting(String value, Object old, int max) {
        if (value != null && !value.trim().isEmpty()) {
            String trimmed = value.trim();
            return trimmed.substring(0, Math.min(max, trimmed.length()));
        }
        return old == null ? null : String.valueOf(old);
    }

//    统一构造数据结构
    private void addressBuilder(String receiverName, String receiverPhone, String province, String city, String district, String detailAddress, String postalCode, String label, UserAddress address) {
        address.setReceiverName(receiverName);
        address.setReceiverPhone(receiverPhone);
        address.setProvince(province);
        address.setCity(city);
        address.setDistrict(district);
        address.setDetailAddress(detailAddress);
        address.setPostalCode(postalCode);
        address.setLabel(label);
    }
}