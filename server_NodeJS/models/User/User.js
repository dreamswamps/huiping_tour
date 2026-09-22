/**
 * 对应表 users
 */
class User {
  constructor(data = {}) {
    this.id = data.id ?? null;
    this.openid = data.openid ?? null;
    this.unionid = data.unionid ?? null;
    this.uid = data.uid ?? null;
    this.nickname = data.nickname ?? null;
    this.avatar = data.avatar ?? null;
    this.score = data.score != null ? Number(data.score) : 0;
    this.createdAt = data.createdAt ?? null;
    this.updatedAt = data.updatedAt ?? null;
  }

  /**
   * @param {object|null|undefined} row mysql2 查询结果的一行（snake_case）
   * @returns {User|null}
   */
  static fromRows(rows) {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => User.fromRow(r)).filter(Boolean);
  }

  static fromRow(row) {
    if (!row) return null;
    return new User({
      id: row.id,
      openid: row.openid,
      unionid: row.unionid,
      uid: row.uid,
      nickname: row.nickname,
      avatar: row.avatar,
      score: row.score,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * 返回可给前端展示的字段（不含 openid / unionid）
   */
  toPublicJSON() {
    return {
      id: this.id,
      uid: this.uid,
      nickname: this.nickname,
      avatar: this.avatar,
      score: this.score,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
