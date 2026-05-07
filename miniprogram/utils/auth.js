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

module.exports = {
  getAuthHeaders,
};
