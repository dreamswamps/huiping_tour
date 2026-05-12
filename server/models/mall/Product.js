/**
 * 对应表 products（商城列表页）
 */
class Product {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.name = data.name ?? '';
    this.price = data.price != null ? Number(data.price) : 0;
    this.thumb = data.thumb ?? null;
    this.stock = data.stock != null ? Number(data.stock) : 0;
    this.status = data.status != null ? Number(data.status) : 1;
    this.createdAt = data.createdAt ?? null;
  }

  static fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => Product.fromRow(r)).filter(Boolean);
  }

  static fromRow(row) {
    if (!row) return null;
    return new Product({
      id: row.id,
      name: row.name,
      price: row.price,
      thumb: row.thumb,
      stock: row.stock,
      status: row.status,
      createdAt: row.created_at,
    });
  }

  /** 列表接口返回（只来自 products 表） */
  toListJSON() {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      thumb: this.thumb,
      stock: this.stock,
      status: this.status,
      createdAt: this.createdAt,
    };
  }
}

module.exports = Product;
