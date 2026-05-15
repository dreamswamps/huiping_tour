const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 4,
    stationNum: 'STATION 04',
    stationTitle: '丰碑永铸',
    stationName: '纪念碑',
    stationDesc: '这座巍峨的纪念碑，承载着无数先烈的英魂。他们用生命铸就了民族的丰碑，用鲜血染红了共和国的旗帜。在此献花致敬，传递革命火把，让精神永续长燃。',
    certUnlocked: false
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

  // 献花AR扫描
  onArFlower() {
    wx.showToast({ title: '启动AR献花…', icon: 'loading' });
  },

  // 传递薪火
  onPassTorch() {
    wx.showToast({ title: '举起手机感应传递…', icon: 'none' });
  },

  // 去这里 - 路线规划
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({
      name: '纪念碑',
      latitude: 30.223,
      longitude: 120.041
    });
    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`
    });
  }
});
