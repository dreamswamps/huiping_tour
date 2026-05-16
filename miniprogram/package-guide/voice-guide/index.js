const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    playingId: '',
    tracks: [
      {
        id: '1',
        name: '陈列馆',
        desc: '红色千里岗革命历史陈列馆'
      },
      {
        id: '2',
        name: '红军路',
        desc: '蛤蟆岭红军路'
      },
      {
        id: '3',
        name: '党史馆',
        desc: '千里岗红色革命党史馆'
      },
      {
        id: '4',
        name: '纪念碑',
        desc: '中共衢遂寿中心县委第二区委旧址纪念碑'
      }
    ]
  },

  onLoad() {},

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onPlayTap(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.tracks.find((t) => t.id === id);
    this.setData({ playingId: id });
    wx.showToast({
      title: item ? item.name : '语音导览',
      icon: 'none'
    });
  }
});
