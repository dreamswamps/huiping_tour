const config = require('../../../../config.js');

Component({
  properties: {
    selected: {
      type: Number,
      value: 2
    }
  },

  data: {
    baseUrl: config.baseUrl,
    list: [
      { pagePath: '/pages/index/index', text: '首页', icon: 'tab-home.svg' },
      { pagePath: '/pages/map/index', text: '传薪地图', icon: 'icon-map.svg' },
      { pagePath: '/pages/mall/index', text: '商城', icon: 'icon-mall.svg' },
      { pagePath: '/pages/profile/index', text: '我的', icon: 'tab-profile.svg' }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const item = this.data.list[index];
      wx.switchTab({ url: item.pagePath });
    }
  }
});
