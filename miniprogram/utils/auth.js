/**
 * 与登录后 storage 中的 userInfo.token 配合使用
 * @param {boolean} [jsonBody] 是否带 application/json
 */
function getAuthHeaders(jsonBody) {
  const userInfo = wx.getStorageSync('userInfo') || {};
  /** @type {Record<string, string>} */
  const headers = {};
  if (jsonBody) {
    headers['content-type'] = 'application/json';
  }
  if (userInfo.token) {
    headers.Authorization = 'Bearer ' + userInfo.token;
  }
  return headers;
}

/** 登录接口返回的 token 与 user id 是否有效（本地校验，服务端仍以 JWT 为准） */
function isUserLoggedIn() {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const token = userInfo.token;
  if (!token || typeof token !== 'string' || !token.trim()) return false;
  if (userInfo.id == null || userInfo.id === '') return false;
  return true;
}

module.exports = {
  getAuthHeaders,
  isUserLoggedIn,
};
