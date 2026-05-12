/**
 * 商品图可能是完整 URL，也可能是本地 img 下的文件名
 */
function resolveMediaUrl(src, baseUrl) {
  if (src == null || src === '') return '';
  const s = String(src).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${baseUrl}/img/${s}`;
}

module.exports = {
  resolveMediaUrl,
};
