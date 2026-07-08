/**
 * 对应表 orders（订单，items 为 JSON 快照）
 */
class Order {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.orderNo = data.orderNo ?? null;
    this.userId = data.userId ?? null;
    this.totalAmount = data.totalAmount != null ? Number(data.totalAmount) : 0;
    this.addressId = data.addressId ?? null;
    this.receiverName = data.receiverName ?? "";
    this.receiverPhone = data.receiverPhone ?? "";
    this.province = data.province ?? "";
    this.city = data.city ?? "";
    this.district = data.district ?? "";
    this.detailAddress = data.detailAddress ?? "";
    this.status = data.status != null ? Number(data.status) : 0;
    this.trackingNo = data.trackingNo ?? null;
    this.payTime = data.payTime ?? null;
    this.deliverTime = data.deliverTime ?? null;
    this.receiveTime = data.receiveTime ?? null;
    this.items = data.items ?? null;
    this.remark = data.remark ?? null;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  static parseItems(val) {
    if (val == null) return val;
    if (typeof val === "object") return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  }

  static fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => Order.fromRow(r)).filter(Boolean);
  }

  static fromRow(row) {
    if (!row) return null;
    return new Order({
      id: row.id,
      orderNo: row.order_no,
      userId: row.user_id,
      totalAmount: row.total_amount,
      addressId: row.address_id,
      receiverName: row.receiver_name,
      receiverPhone: row.receiver_phone,
      province: row.province,
      city: row.city,
      district: row.district,
      detailAddress: row.detail_address,
      status: row.status,
      trackingNo: row.tracking_no,
      payTime: row.pay_time,
      deliverTime: row.deliver_time,
      receiveTime: row.receive_time,
      items: Order.parseItems(row.items),
      remark: row.remark,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  toPublicJSON() {
    return {
      id: this.id,
      orderNo: this.orderNo,
      totalAmount: this.totalAmount,
      receiverName: this.receiverName,
      receiverPhone: this.receiverPhone,
      province: this.province,
      city: this.city,
      district: this.district,
      detailAddress: this.detailAddress,
      status: this.status,
      trackingNo: this.trackingNo,
      payTime: this.payTime,
      deliverTime: this.deliverTime,
      receiveTime: this.receiveTime,
      items: this.items,
      remark: this.remark,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Order;
