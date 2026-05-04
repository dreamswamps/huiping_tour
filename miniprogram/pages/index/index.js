Page({
  data: {
    swiperCurrent: 2,  // 默认第3张（中间）
    currentTab: 0      // 当前选中的tab索引：0=首页, 1=传薪地图, 2=商城, 3=我的
  },

  onLoad() {},

  // ========== TabBar 切换（容器内切换，不跳转页面） ==========
  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentTab: index });
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
    const titles = { map: '传薪地图', ar: 'AR扫描', badge: '任务徽章' };
    if (type === 'map') {
      wx.switchTab({ url: '/pages/map/index' });
    } else {
      wx.showToast({ title: titles[type], icon: 'none' });
    }
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
