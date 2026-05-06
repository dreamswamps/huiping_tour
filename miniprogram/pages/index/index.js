const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,
    swiperCurrent: 2
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  // 轮播图切换事件
  onSwiperChange(e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },

  // 上一张轮播图
  onPrevSlide() {
    let current = this.data.swiperCurrent;
    if (current === 0) {
      current = 4; // 回到最后一个
    } else {
      current--;
    }
    this.setData({ swiperCurrent: current });
  },

  // 下一张轮播图
  onNextSlide() {
    let current = this.data.swiperCurrent;
    if (current === 4) {
      current = 0; // 回到第一个
    } else {
      current++;
    }
    this.setData({ swiperCurrent: current });
  },

  onUserTap() {
    wx.switchTab({
      url: '/pages/profile/index'
    });
  },

  // 功能卡片点击
  onFuncCard(e) {
    const type = e.currentTarget.dataset.type;
    const titles = { ar: 'AR扫描', badge: '任务徽章' };
    wx.showToast({ title: titles[type], icon: 'none' });
  },
  
  goToSubmodule(e) {
    const { url } = e.currentTarget.dataset
    if (!url) return
    wx.navigateTo({
      url
    })
  },

  // AI导览
  onAIGuide() {
    wx.showToast({ title: 'AI导览', icon: 'none' });
  },

  // 景点详情
  onSpotDetail(e) {
    wx.showToast({ title: '景点详情', icon: 'none' });
  },

  // Tab跳转
  goMap() {
    wx.switchTab({ url: '/pages/map/index' });
  },

  goMall() {
    wx.switchTab({ url: '/pages/mall/index' });
  },

  goProfile() {
    wx.switchTab({ url: '/pages/profile/index' });
  }
});
