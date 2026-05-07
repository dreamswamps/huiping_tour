const config = require('../../../config.js');

Page({
  data: {
    baseUrl: config.baseUrl
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onFabCart() {
    wx.navigateTo({ url: '/pages/mall/cart/index' });
  },

  onShareAppMessage() {
    return {
      title: '传薪·燎原｜传薪茶社',
      path: '/pages/mall/liaoyuan/index'
    };
  }
});
