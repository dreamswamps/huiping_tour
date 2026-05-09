const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});
