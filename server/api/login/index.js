const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const WX_CONFIG = require('../../config/wechat');
const jwtConfig = require('../../config/jwt');

const router = express.Router();

router.post('/', async (req, res) => {
  const { code, nickname: bodyNickname, avatar: bodyAvatar } = req.body || {};

  if (!code) {
    return res.status(400).json({ code: 400, message: '缺少 code 参数' });
  }

  if (!WX_CONFIG.secret) {
    console.error('未配置 WX_MINI_SECRET，无法调用 jscode2session');
    return res.status(500).json({
      code: 500,
      message: '服务端未配置小程序 AppSecret，请设置环境变量 WX_MINI_SECRET',
    });
  }

  const displayName =
    typeof bodyNickname === 'string' && bodyNickname.trim()
      ? bodyNickname.trim().slice(0, 100)
      : null;
  const avatarUrl =
    typeof bodyAvatar === 'string' && bodyAvatar.trim()
      ? bodyAvatar.trim().slice(0, 512)
      : null;

  try {
    const wxResponse = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: WX_CONFIG.appid,
        secret: WX_CONFIG.secret,
        js_code: code,
        grant_type: 'authorization_code',
      },
    });

    const { openid, errcode, errmsg } = wxResponse.data;

    if (errcode) {
      console.error('微信登录失败:', errcode, errmsg);
      return res.status(400).json({
        code: 400,
        message: '微信登录失败',
        errcode,
        errmsg,
      });
    }

    let user = null;
    let dbErrorDetail = null;
    let newUserUid = null;
    try {
      const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
      if (rows.length > 0) {
        user = rows[0];
        if (user && (!user.uid || String(user.uid).trim() === '')) {
          const fillUid = 'CX' + Date.now().toString().slice(-8);
          try {
            await pool.query('UPDATE users SET uid = ? WHERE openid = ?', [fillUid, openid]);
            user.uid = fillUid;
          } catch (_) {
            /* 旧表无 uid 列时忽略 */
          }
        }
      } else {
        const nickname = displayName || '旅行者' + Math.floor(Math.random() * 10000);
        const uid = 'CX' + Date.now().toString().slice(-8);
        newUserUid = uid;
        try {
          await pool.query(
            'INSERT INTO users (openid, nickname, uid, avatar) VALUES (?, ?, ?, ?)',
            [openid, nickname, uid, avatarUrl]
          );
        } catch (e1) {
          await pool.query(
            'INSERT INTO users (openid, nickname, avatar) VALUES (?, ?, ?)',
            [openid, nickname, avatarUrl]
          );
          try {
            await pool.query(
              'UPDATE users SET uid = ? WHERE openid = ? AND (uid IS NULL OR uid = \'\')',
              [uid, openid]
            );
          } catch (_) {
            /* 无 uid 列 */
          }
        }
        const [inserted] = await pool.query('SELECT * FROM users WHERE openid = ?', [openid]);
        user = inserted[0];
      }
    } catch (dbError) {
      dbErrorDetail = dbError.message || String(dbError);
      console.error('数据库操作失败:', dbErrorDetail);
    }

    const numericId =
      user && user.id != null
        ? typeof user.id === 'bigint'
          ? Number(user.id)
          : Number(user.id)
        : null;
    const idOk = numericId != null && Number.isInteger(numericId) && numericId > 0;

    if (!user || !idOk) {
      return res.status(200).json({
        code: 503,
        message:
          '微信已通过，但用户数据未写入数据库（无 token）。请检查 MySQL 中 hpt.users 表是否与 init.sql 一致，或查看服务端日志。',
        data: {
          openid,
          id: null,
          nickname: displayName || '旅行者',
          uid: '',
          avatar: avatarUrl || '',
          token: null,
          dbError: dbErrorDetail,
        },
      });
    }

    const token = jwt.sign(
      { userId: numericId, openid },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        openid,
        id: numericId,
        nickname: user.nickname || displayName || '旅行者',
        uid: (user.uid && String(user.uid).trim()) || newUserUid || '',
        avatar: user.avatar || avatarUrl || '',
        token,
      },
    });
  } catch (error) {
    console.error('登录接口异常:', error.message);
    res.status(500).json({ code: 500, message: '服务器错误' });
  }
});

module.exports = router;
