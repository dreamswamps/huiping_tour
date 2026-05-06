const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,

    // 功能卡片（4宫格）
    funcList: [
      { id: 1, icon: '🗺️', label: '传薪足迹' },
      { id: 2, icon: '🏅', label: '我的徽章' },
      { id: 3, icon: '🎁', label: '我的权益' },
      { id: 4, icon: '📖', label: '故事收藏' }
    ],

    // 菜单列表
    menuList: [
      {
        id: 1,
        label: '个人信息',
        badge: '2条未读',
        iconBg: 'profile-menu-1-bg',
        iconFg: 'profile-menu-1-fg'
      },
      {
        id: 2,
        label: '收货地址',
        iconBg: 'profile-menu-2-bg',
        iconFg: 'profile-menu-2-fg'
      },
      {
        id: 3,
        label: '隐私设置',
        iconBg: 'profile-menu-3-bg',
        iconFg: 'profile-menu-3-fg'
      },
      {
        id: 4,
        label: '支付管理',
        iconBg: 'profile-menu-4-bg',
        iconFg: 'profile-menu-4-fg'
      },
      {
        id: 5,
        label: '消息通知',
        iconBg: 'profile-menu-5-bg',
        iconFg: 'profile-menu-5-fg'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  onMenuTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({ title: `菜单项${id}`, icon: 'none' });
  },

  onFuncTap(e) {
    const { id } = e.currentTarget.dataset;
    if (id === 3) {
      wx.navigateTo({ url: '/pages/benefits/index' });
    } else {
      wx.showToast({ title: `功能${id}`, icon: 'none' });
    }
  }
});
