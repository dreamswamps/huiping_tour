const config = require('../../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 5,
    stationNum: 'STATION 05',
    stationTitle: '薪火续燃',
    stationName: '红军村',
    stationDesc: '红军村是传薪之旅的终点，也是新的起点。在这里发布您的传薪宣言，让革命精神在您手中继续燃烧，让新的火焰照亮未来的征程。',
    declarationText: '',
    maxLen: 50,
    declarations: []
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
    this.loadDeclarations();
  },

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  onInputDecl(e) {
    this.setData({ declarationText: e.detail.value });
  },

  onPublish() {
    const { declarationText, maxLen } = this.data;
    if (!declarationText.trim()) {
      wx.showToast({ title: '请输入传薪宣言', icon: 'none' });
      return;
    }
    if (declarationText.length > maxLen) {
      wx.showToast({ title: `最多${maxLen}字`, icon: 'none' });
      return;
    }
    wx.showToast({ title: '发布成功', icon: 'success' });
    this.setData({ declarationText: '' });
    this.loadDeclarations();
  },

  loadDeclarations() {
    this.setData({
      declarations: [
        { content: '薪火相传，生生不息！', time: '刚刚' },
        { content: '让革命的火焰永远燃烧！', time: '2分钟前' },
        { content: '传承精神，续写时代新篇！', time: '7分钟前' }
      ]
    });
  }
});
