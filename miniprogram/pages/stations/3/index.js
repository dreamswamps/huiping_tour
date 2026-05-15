const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 3,
    stationNum: 'STATION 03',
    stationTitle: '淬火成钢',
    stationName: '党史馆',
    stationDesc: '党史馆内，那盏三角煤油灯见证了无数个不眠之夜。先辈们在昏暗的灯光下研读马列、制定战略，正是这种坚定的信仰，让他们在艰难岁月中淬火成钢。',
    hasSigned: false
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

  // AR扫描采集煤油灯
  onArScan() {
    wx.showToast({
      title: '正在启动AR扫描…',
      icon: 'loading'
    });
  },

  // 签署守护承诺书
  onSignPledge() {
    if (this.data.hasSigned) {
      wx.showToast({ title: '已签署过承诺书', icon: 'none' });
      return;
    }
    this.setData({ hasSigned: true });
    wx.showToast({
      title: '签署成功！',
      icon: 'success'
    });
  },

  // 去这里 - 路线规划
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({
      name: '党史馆',
      latitude: 30.222,
      longitude: 120.040
    });
    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`
    });
  }
});
