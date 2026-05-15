const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 1,
    stationNum: 'STATION 01',
    stationTitle: '星火初燃',
    stationName: '陈列馆',
    stationDesc: '1935年，革命先烈在此点燃了革命的第一束火种。这座陈列馆记录了那段激情燃烧的岁月，见证了无数英雄儿女为民族解放抛头颅、洒热血的豪情壮志。'
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
  },

  // 返回地图
  onBackToMap() {
    wx.navigateBack();
  },

  // 返回首页
  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 点亮初心火种 - AR扫描
  onArScan() {
    // TODO: 调用AR扫描功能
    wx.showToast({ title: '正在启动AR扫描…', icon: 'none' });
  },

  // 播放广播剧
  onPlayRadio() {
    // TODO: 跳转播放页面
    wx.showToast({ title: '正在播放《夜袭镇公所》', icon: 'none' });
  },

  // 去这里 - 路线规划到浙江外国语学院
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';

    // 浙江外国语学院（小和山校区）坐标
    const endPoint = JSON.stringify({
      name: '浙江外国语学院',
      latitude: 30.22075,
      longitude: 120.038711
    });

    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`
    });
  }
});
