const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,

    // 优惠券数据
    coupons: [
      {
        id: 1,
        value: '9折',
        type: '优惠',
        title: '传薪红茶 9折券',
        desc: '全系列红茶产品通用',
        expiry: '有效期至2025.03.31'
      },
      {
        id: 2,
        value: '免费',
        type: '体验',
        title: '茶园免费品鉴',
        desc: '茶园现场品鉴1人次',
        expiry: '有效期至2025.03.31'
      },
      {
        id: 3,
        value: '8折',
        type: '优惠',
        title: '传薪故事集 8折',
        desc: '实体版红色故事书籍',
        expiry: '有效期至2025.02.28'
      }
    ]
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 立即领取
  onClaim(e) {
    const { id } = e.currentTarget.dataset;
    wx.showToast({ title: `已领取优惠券${id}`, icon: 'success' });
  }
});
