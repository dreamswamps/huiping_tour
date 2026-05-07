/**
 * 对应表 user_addresses
 */
class UserAddress {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.userId = data.userId ?? null;
    this.receiverName = data.receiverName ?? null;
    this.receiverPhone = data.receiverPhone ?? null;
    this.province = data.province ?? null;
    this.city = data.city ?? null;
    this.district = data.district ?? null;
    this.detailAddress = data.detailAddress ?? null;
    this.postalCode = data.postalCode ?? null;
    this.label = data.label ?? null;
    this.isDefault = Boolean(data.isDefault);
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  /**
   * @param {object|null|undefined} row mysql2 查询结果的一行（snake_case）
   * @returns {UserAddress|null}
   */
  static fromRow(row) {
    if (!row) return null;
    return new UserAddress({
      id: row.id,
      userId: row.user_id,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      province: row.province,
      city: row.city,
      district: row.district,
      detailAddress: row.detail_address,
      postalCode: row.postal_code,
      label: row.label,
      isDefault: row.is_default === 1 || row.is_default === true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => UserAddress.fromRow(r)).filter(Boolean);
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      province: this.province,
      city: this.city,
      district: this.district,
      detailAddress: this.detailAddress,
      postalCode: this.postalCode,
      label: this.label,
      isDefault: this.isDefault,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = UserAddress;
