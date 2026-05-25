const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,svgsUrl: config.svgsUrl,
    swiperCurrent: 0,
    bannerList: [
      { id: 'b0', img: 'https://free.picui.cn/free/2026/05/16/6a086d31ce3fb.jpg' },
      { id: 'b1', img: 'https://free.picui.cn/free/2026/05/16/6a086d3220a37.jpg' },
      { id: 'b2', img: 'https://free.picui.cn/free/2026/05/16/6a086d327a2eb.png' },
      { id: 'b3', img: 'https://free.picui.cn/free/2026/05/16/6a086d3270d2e.png' },
      { id: 'b4', img: 'https://free.picui.cn/free/2026/05/16/6a086d333fd60.png' }
    ],
    // spots: [
    //   { title: '两头洞', desc: '华东自然岩壁第一洞' , img: 'homepage1.png' },
    //   { title: '白塔洞', desc: '位于灰坪乡杜家田村以西，洞崖滴水，常年不绝', img: 'homepage2.png' },
    //   { title: '中共衢遂寿中心县委第二区委旧址', desc: '光荣革命传统的圣地', img: 'homepage3.png' }
    // ]
    spots: [
      { title: '两头洞', desc: '华东自然岩壁第一洞' , img: 'https://free.picui.cn/free/2026/05/16/6a086d2561ca0.png' },
      { title: '白塔洞', desc: '位于灰坪乡杜家田村以西，洞崖滴水，常年不绝', img: 'https://free.picui.cn/free/2026/05/16/6a086d2564bd3.png' },
      { title: '中共衢遂寿中心县委第二区委旧址', desc: '光荣革命传统的圣地', img: 'https://free.picui.cn/free/2026/05/16/6a086d27176a5.png' }
    ]
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onSwiperChange(e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },

  onPrevSlide() {
    const n = this.data.bannerList.length;
    let current = this.data.swiperCurrent;
    current = current === 0 ? n - 1 : current - 1;
    this.setData({ swiperCurrent: current });
  },

  onNextSlide() {
    const n = this.data.bannerList.length;
    let current = this.data.swiperCurrent;
    current = current === n - 1 ? 0 : current + 1;
    this.setData({ swiperCurrent: current });
  },

  onScanTap() {
    wx.navigateTo({ url: '/package-other/cloudar/cloudar' });
  },

  onFuncCard(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'badge') {
      wx.showToast({ title: '我的徽章', icon: 'none' });
      return;
    }
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  goToSubmodule(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    wx.navigateTo({ url });
  },

  onVoiceGuide() {
    wx.navigateTo({ url: '/package-guide/voice-guide/index' });
  },

  onSpotDetail(e) {
    const title = e.currentTarget.dataset.title || '';
    if (title === '两头洞') {
      wx.navigateTo({ url: '/package-guide/liangtoudong/index' });
      return;
    }
    if (title === '白塔洞') {
      wx.navigateTo({ url: '/package-guide/baitadong/index' });
      return;
    }
    if (title === '中共衢遂寿中心县委第二区委旧址') {
      wx.navigateTo({ url: '/package-guide/dierquweijiuzhi/index' });
      return;
    }
    wx.showToast({ title: title || '景点详情', icon: 'none' });
  },

  goMap() {
    wx.switchTab({ url: '/pages/map/index' });
  }
});
