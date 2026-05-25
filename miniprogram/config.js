/**
 * 全局配置
 * baseUrl: 后端服务地址，部署后改为实际服务器IP或域名
 */
module.exports = {
  // 须与后端监听端口一致（server/app.js：process.env.PORT || 3000）
  // 若你在 .env 里写了 PORT=5000，这里要改成 http://localhost:5000
  baseUrl: 'https://www.huipingzhiyou.cn',
  // baseUrl: 'https://weir123456.cloud',
  //  baseUrl: 'https://110.40.187.34',
  // baseUrl: 'https://1b54b328.r31.cpolar.top',
//  baseUrl: 'https://127.0.0.1',
 svgsUrl: 'https://svgs1.oss-cn-beijing.aliyuncs.com',
  // 腾讯地图插件 Key（lbs 服务）
  qqMapKey: '37OBZ-T3YKC-ZOQ24-AQEFG-QJ3ST-ADFAU',
};
