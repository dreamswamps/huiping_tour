const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 2,
    stationNum: 'STATION 02',
    stationTitle: '薪火相传',
    stationName: '红军路',
    stationDesc: '沿着红军当年走过的山路，您将感受到那段艰苦卓绝的岁月。路旁的红豆杉见证了先烈们英勇前行的步伐，用AR扫描这棵千年古树，解锁《雪妹与雪泉》的感人故事。'
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
  },

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // AR扫描 - 采集红色榧子
  onArScan() {
    wx.showToast({ title: '正在启动AR扫描…', icon: 'none' });
  },

  // 观看人物动画
  onAnimationPlay() {
    wx.showToast({ title: '正在播放《雪妹与雪泉》', icon: 'none' });
  },

  // 去这里 - 路线规划
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({
      name: '红军路',
      latitude: 30.221,
      longitude: 120.039
    });
    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`
    });
  }
});
