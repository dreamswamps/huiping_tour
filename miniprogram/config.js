/**
 * 全局配置
 * baseUrl: 后端服务地址，部署后改为实际服务器IP或域名
 */
module.exports = {
  // 须与后端监听端口一致（server/app.js：process.env.PORT || 3000）
  // 若你在 .env 里写了 PORT=5000，这里要改成 http://localhost:5000
  baseUrl: 'http://110.40.187.34:3000',

  // 腾讯地图插件 Key（lbs 服务）
  qqMapKey: '37OBZ-T3YKC-ZOQ24-AQEFG-QJ3ST-ADFAU',
};
