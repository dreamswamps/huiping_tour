/**
 * 对应表 product_details（商品详情页）
 */
class ProductDetail {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.productId = data.productId ?? null;
    this.productName = data.productName ?? "";
    this.subtitle = data.subtitle ?? null;
    this.description = data.description ?? null;
    this.images = data.images ?? null;
    this.content = data.content ?? null;
    this.attrs = data.attrs ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  static parseJsonField(val) {
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

  static fromRow(row) {
    if (!row) return null;
    return new ProductDetail({
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      subtitle: row.subtitle,
      description: row.description,
      images: ProductDetail.parseJsonField(row.images),
      content: row.content,
      attrs: ProductDetail.parseJsonField(row.attrs),
      updatedAt: row.updated_at,
    });
  }

  toPublicJSON() {
    return {
      id: this.id,
      productId: this.productId,
      productName: this.productName,
      subtitle: this.subtitle,
      description: this.description,
      images: this.images,
      content: this.content,
      attrs: this.attrs,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = ProductDetail;
