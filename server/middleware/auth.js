const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

function requireUserAuth(req, res, next) {
  const raw = req.headers.authorization || '';
  const m = /^Bearer\s+(\S+)$/i.exec(raw);
  if (!m) {
    return res.status(401).json({ code: 401, message: '未登录或缺少 token' });
  }
  try {
    const payload = jwt.verify(m[1], jwtConfig.secret);
    if (!payload.userId || !payload.openid) {
      return res.status(401).json({ code: 401, message: 'token 无效' });
    }
    req.auth = {
      userId: Number(payload.userId),
      openid: String(payload.openid),
    };
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: 'token 无效或已过期' });
  }
}

module.exports = { requireUserAuth };
