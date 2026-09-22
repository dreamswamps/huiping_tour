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

    private final AddressMapper mapper;
    private final AddressTxService txService;

    public AddressService(AddressMapper mapper, AddressTxService txService) {
        this.mapper = mapper;
        this.txService = txService;
    }

    /** 查询用户地址，并按默认地址优先返回。 */
    public List<UserAddress> list(Long userId) {
        return mapper.findByUserId(userId);
    }

    /** 查询用户自己的地址，避免通过地址 ID 越权访问他人数据。 */
    public UserAddress get(Long userId, Long addressId) {
        UserAddress addr = mapper.findById(userId, addressId);
        if (addr == null) {
            throw missing();
        }
        return addr;
    }

    /** 新增地址；第一个地址自动成为默认地址。 */
    public UserAddress add(Long userId, AddressRequest req) {
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
        if (mapper.countByUserId(userId) == 0) {
            isDefault = true;
        }

        UserAddress address = new UserAddress();
        address.setUser_id(userId);
        addressBuilder(receiverName, receiverPhone, province, city, district, detailAddress, postalCode, label, address);
        address.setIs_default(0);

        Long newId = txService.insertAndMaintainDefault(userId, address, isDefault);
        return get(userId, newId);
    }

    /** 更新地址；未提交的字段保留原值。 */
    public UserAddress update(Long userId, Long addressId, AddressRequest req) {
        UserAddress old = get(userId, addressId);

        String receiverName = valueOrOld(req.getReceiverName(), old.getReceiver_name(), 50);
        String receiverPhone = valueOrOld(req.getReceiverPhone(), old.getReceiver_phone(), 20);
        String province = valueOrOld(req.getProvince(), old.getProvince(), 32);
        String city = valueOrOld(req.getCity(), old.getCity(), 32);
        String district = valueOrOld(req.getDistrict(), old.getDistrict(), 32);
        String detailAddress = valueOrOld(req.getDetailAddress(), old.getDetail_address(), 255);
        validate(receiverName, receiverPhone, province, city, district, detailAddress);
        String postalCode = valueOrExisting(req.getPostalCode(), old.getPostal_code(), 10);
        String label = valueOrExisting(req.getLabel(), old.getLabel(), 20);

        UserAddress addr = new UserAddress();
        addressBuilder(receiverName, receiverPhone, province, city, district, detailAddress, postalCode, label, addr);

        Boolean isDefault = req.getIsDefault();
        txService.updateAndMaintainDefault(userId, addressId, addr, isDefault);
        return get(userId, addressId);
    }

    /** 删除地址；删除默认地址后自动提升最早的一条地址。 */
    public void delete(Long userId, Long addressId) {
        UserAddress old = get(userId, addressId);
        txService.deleteAndPromote(userId, addressId, truthy(old.getIs_default()));
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
        address.setReceiver_name(receiverName);
        address.setReceiver_phone(receiverPhone);
        address.setProvince(province);
        address.setCity(city);
        address.setDistrict(district);
        address.setDetail_address(detailAddress);
        address.setPostal_code(postalCode);
        address.setLabel(label);
    }
}