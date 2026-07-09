/**
 * 对应表 carts（购物车）
 */
class MallCart {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.userId = data.userId ?? null;
    this.productId = data.productId ?? null;
    this.productName = data.productName ?? "";
    this.productPrice =
      data.productPrice != null ? Number(data.productPrice) : 0;
    this.productThumb = data.productThumb ?? null;
    this.quantity = data.quantity != null ? Number(data.quantity) : 1;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  static fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => MallCart.fromRow(r)).filter(Boolean);
  }

  static fromRow(row) {
    if (!row) return null;
    return new MallCart({
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      productName: row.product_name,
      productPrice: row.product_price,
      productThumb: row.product_thumb,
      quantity: row.quantity,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  toPublicJSON() {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      productPrice: this.productPrice,
      productThumb: this.productThumb,
      quantity: this.quantity,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = MallCart;
