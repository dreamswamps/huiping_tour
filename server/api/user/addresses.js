const pool = require('../../config/db');

function mapRow(r) {
  return {
    id: r.id,
    userId: r.user_id,
    receiverName: r.receiver_name,
    receiverPhone: r.receiver_phone,
    province: r.province,
    city: r.city,
    district: r.district,
    detailAddress: r.detail_address,
    postalCode: r.postal_code || '',
    label: r.label || '',
    isDefault: r.is_default === 1,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function ensureAddressOwner(userId, addressId) {
  const [rows] = await pool.query(
    'SELECT * FROM user_addresses WHERE id = ? AND user_id = ?',
    [addressId, userId]
  );
  return rows[0] || null;
}

async function clearDefaultForUser(userId) {
  await pool.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
}

async function setAsOnlyDefault(userId, addressId) {
  await clearDefaultForUser(userId);
  await pool.query('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [
    addressId,
    userId,
  ]);
}

async function promoteFirstDefaultIfNone(userId) {
  const [[row]] = await pool.query(
    'SELECT id FROM user_addresses WHERE user_id = ? AND is_default = 1 LIMIT 1',
    [userId]
  );
  if (row) return;
  const [[first]] = await pool.query(
    'SELECT id FROM user_addresses WHERE user_id = ? ORDER BY id ASC LIMIT 1',
    [userId]
  );
  if (first) {
    await pool.query('UPDATE user_addresses SET is_default = 1 WHERE id = ?', [first.id]);
  }
}

function assertOwnUser(req, res) {
  const paramId = Number(req.params.userId);
  if (!Number.isInteger(paramId) || paramId < 1) {
    res.status(400).json({ code: 400, message: '无效的用户 id' });
    return false;
  }
  if (paramId !== req.auth.userId) {
    res.status(403).json({ code: 403, message: '无权访问' });
    return false;
  }
  return true;
}

/**
 * @param {import('express').Router} router
 * @param {import('express').RequestHandler} requireUserAuth
 */
function register(router, requireUserAuth) {
  router.get('/:userId/addresses/:addressId', requireUserAuth, async (req, res) => {
    if (!assertOwnUser(req, res)) return;
    const userId = req.auth.userId;
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      return res.status(400).json({ code: 400, message: '无效的参数' });
    }
    try {
      const row = await ensureAddressOwner(userId, addressId);
      if (!row) {
        return res.status(404).json({ code: 404, message: '地址不存在' });
      }
      res.json({ code: 200, data: mapRow(row) });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  });

  router.get('/:userId/addresses', requireUserAuth, async (req, res) => {
    if (!assertOwnUser(req, res)) return;
    const userId = req.auth.userId;
    try {
      const [rows] = await pool.query(
        `SELECT id, user_id, receiver_name, receiver_phone, province, city, district,
          detail_address, postal_code, label, is_default, created_at, updated_at
         FROM user_addresses WHERE user_id = ?
         ORDER BY is_default DESC, id DESC`,
        [userId]
      );
      res.json({ code: 200, data: rows.map(mapRow) });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  });

  router.post('/:userId/addresses', requireUserAuth, async (req, res) => {
    if (!assertOwnUser(req, res)) return;
    const userId = req.auth.userId;

    const b = req.body || {};
    const receiverName = typeof b.receiverName === 'string' ? b.receiverName.trim().slice(0, 50) : '';
    const receiverPhone = typeof b.receiverPhone === 'string' ? b.receiverPhone.trim().slice(0, 20) : '';
    const province = typeof b.province === 'string' ? b.province.trim().slice(0, 32) : '';
    const city = typeof b.city === 'string' ? b.city.trim().slice(0, 32) : '';
    const district = typeof b.district === 'string' ? b.district.trim().slice(0, 32) : '';
    const detailAddress = typeof b.detailAddress === 'string' ? b.detailAddress.trim().slice(0, 255) : '';
    const postalCode =
      typeof b.postalCode === 'string' && b.postalCode.trim()
        ? b.postalCode.trim().slice(0, 10)
        : null;
    const label =
      typeof b.label === 'string' && b.label.trim() ? b.label.trim().slice(0, 20) : null;
    let isDefault = b.isDefault === true || b.isDefault === 1 || b.isDefault === '1';

    if (!receiverName || !receiverPhone || !province || !city || !district || !detailAddress) {
      return res.status(400).json({ code: 400, message: '请填写完整的收货信息' });
    }

    try {
      const [[{ c }]] = await pool.query(
        'SELECT COUNT(*) as c FROM user_addresses WHERE user_id = ?',
        [userId]
      );
      const isFirst = Number(c) === 0;
      if (isFirst) isDefault = true;

      const [ins] = await pool.query(
        `INSERT INTO user_addresses
          (user_id, receiver_name, receiver_phone, province, city, district, detail_address, postal_code, label, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [userId, receiverName, receiverPhone, province, city, district, detailAddress, postalCode, label]
      );
      const newId = ins.insertId;

      if (isDefault) {
        await setAsOnlyDefault(userId, newId);
      } else {
        await promoteFirstDefaultIfNone(userId);
      }

      const [rows] = await pool.query(
        `SELECT id, user_id, receiver_name, receiver_phone, province, city, district,
          detail_address, postal_code, label, is_default, created_at, updated_at
         FROM user_addresses WHERE id = ?`,
        [newId]
      );
      res.json({ code: 200, message: '添加成功', data: mapRow(rows[0]) });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  });

  router.put('/:userId/addresses/:addressId', requireUserAuth, async (req, res) => {
    if (!assertOwnUser(req, res)) return;
    const userId = req.auth.userId;
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      return res.status(400).json({ code: 400, message: '无效的参数' });
    }

    const existing = await ensureAddressOwner(userId, addressId);
    if (!existing) {
      return res.status(404).json({ code: 404, message: '地址不存在' });
    }

    const b = req.body || {};
    const receiverName =
      typeof b.receiverName === 'string' ? b.receiverName.trim().slice(0, 50) : existing.receiver_name;
    const receiverPhone =
      typeof b.receiverPhone === 'string' ? b.receiverPhone.trim().slice(0, 20) : existing.receiver_phone;
    const province = typeof b.province === 'string' ? b.province.trim().slice(0, 32) : existing.province;
    const city = typeof b.city === 'string' ? b.city.trim().slice(0, 32) : existing.city;
    const district = typeof b.district === 'string' ? b.district.trim().slice(0, 32) : existing.district;
    const detailAddress =
      typeof b.detailAddress === 'string'
        ? b.detailAddress.trim().slice(0, 255)
        : existing.detail_address;
    const postalCode =
      typeof b.postalCode === 'string' && b.postalCode.trim()
        ? b.postalCode.trim().slice(0, 10)
        : existing.postal_code;
    const label =
      typeof b.label === 'string' && b.label.trim() ? b.label.trim().slice(0, 20) : existing.label;

    let isDefault = existing.is_default === 1;
    if (b.isDefault !== undefined) {
      isDefault = b.isDefault === true || b.isDefault === 1 || b.isDefault === '1';
    }

    if (!receiverName || !receiverPhone || !province || !city || !district || !detailAddress) {
      return res.status(400).json({ code: 400, message: '请填写完整的收货信息' });
    }

    try {
      await pool.query(
        `UPDATE user_addresses SET
          receiver_name = ?, receiver_phone = ?, province = ?, city = ?, district = ?,
          detail_address = ?, postal_code = ?, label = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          receiverName,
          receiverPhone,
          province,
          city,
          district,
          detailAddress,
          postalCode,
          label,
          addressId,
          userId,
        ]
      );

      if (isDefault) {
        await setAsOnlyDefault(userId, addressId);
      } else {
        await pool.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        const [[pick]] = await pool.query(
          'SELECT id FROM user_addresses WHERE user_id = ? AND id != ? ORDER BY id ASC LIMIT 1',
          [userId, addressId]
        );
        const targetId = pick ? pick.id : addressId;
        await pool.query('UPDATE user_addresses SET is_default = 1 WHERE id = ?', [targetId]);
      }

      const [rows] = await pool.query(
        `SELECT id, user_id, receiver_name, receiver_phone, province, city, district,
          detail_address, postal_code, label, is_default, created_at, updated_at
         FROM user_addresses WHERE id = ?`,
        [addressId]
      );
      res.json({ code: 200, message: '保存成功', data: mapRow(rows[0]) });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  });

  router.delete('/:userId/addresses/:addressId', requireUserAuth, async (req, res) => {
    if (!assertOwnUser(req, res)) return;
    const userId = req.auth.userId;
    const addressId = Number(req.params.addressId);
    if (!Number.isInteger(addressId) || addressId < 1) {
      return res.status(400).json({ code: 400, message: '无效的参数' });
    }

    const existing = await ensureAddressOwner(userId, addressId);
    if (!existing) {
      return res.status(404).json({ code: 404, message: '地址不存在' });
    }

    try {
      const wasDefault = existing.is_default === 1;
      await pool.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
      if (wasDefault) {
        await promoteFirstDefaultIfNone(userId);
      }
      res.json({ code: 200, message: '已删除' });
    } catch (e) {
      res.status(500).json({ code: 500, message: e.message });
    }
  });
}

module.exports = { register };
