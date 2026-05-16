const config = require('../../config.js');
const cartStorage = require('../../utils/cartStorage.js');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl.js');
const { isUserLoggedIn } = require('../../utils/auth.js');

function promptLoginThenProfile() {
  wx.showModal({
    title: '需要登录',
    content: '请先登录后再使用购物车与购买功能',
    confirmText: '去登录',
    cancelText: '取消',
    success(res) {
      if (res.confirm) wx.switchTab({ url: '/pages/profile/index' });
    },
  });
}

function attrsToList(attrs) {
  if (!attrs || typeof attrs !== 'object') return [];
  return Object.keys(attrs).map((k) => ({ key: k, value: String(attrs[k] ?? '') }));
}

function subtitleTags(subtitle) {
  if (!subtitle || typeof subtitle !== 'string') return [];
  return subtitle
    .split(/[|｜,，、]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

Page({
  data: {
    baseUrl: config.baseUrl,
    loading: true,
    loadError: '',
    productId: null,
    listPrice: 0,
    listThumb: '',
    detail: null,
    galleryUrls: [],
    attrList: [],
    subtitleTagList: [],
    priceText: '',
  },

  onLoad(query) {
    const productId = Number(query.productId);
    const listPrice = query.price != null && query.price !== '' ? Number(query.price) : 0;
    const listThumb = query.thumb ? decodeURIComponent(query.thumb) : '';
    this.setData({
      productId: Number.isFinite(productId) && productId > 0 ? productId : null,
      listPrice,
      listThumb,
      priceText: listPrice > 0 ? listPrice.toFixed(2) : '',
    });
    if (!this.data.productId) {
      this.setData({ loading: false, loadError: '无效的商品' });
      return;
    }
    this.fetchDetail(this.data.productId, listThumb);
  },

  fetchDetail(productId, fallbackThumb) {
    this.setData({ loading: true, loadError: '' });
    const { baseUrl } = this.data;
    wx.request({
      url: `${baseUrl}/api/mall/product-details`,
      data: { productId },
      success: (res) => {
        const body = res.data || {};
        if (body.code !== 200 || !body.data) {
          this.setData({
            loading: false,
            loadError: body.message || '加载失败',
          });
          return;
        }
        const d = body.data;
        const imgs = Array.isArray(d.images) ? d.images : [];
        const galleryUrls = imgs
          .map((u) => resolveMediaUrl(u, baseUrl))
          .filter(Boolean);
        if (galleryUrls.length === 0 && fallbackThumb) {
          galleryUrls.push(resolveMediaUrl(fallbackThumb, baseUrl));
        }
        this.setData({
          loading: false,
          detail: d,
          galleryUrls,
          attrList: attrsToList(d.attrs),
          subtitleTagList: subtitleTags(d.subtitle),
        });
      },
      fail: () => {
        this.setData({ loading: false, loadError: '网络异常' });
      },
    });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onFabCart() {
    wx.navigateTo({ url: '/package-mall/cart/index' });
  },

  showMallTip(opts) {
    const comp = this.selectComponent('#mallFigmaTip');
    if (comp) comp.show(opts);
  },

  onAddCart() {
    if (!isUserLoggedIn()) {
      promptLoginThenProfile();
      return;
    }
    const { productId, detail, listPrice, listThumb, baseUrl } = this.data;
    if (!productId || !detail) return;
    const thumbForCart =
      listThumb || (Array.isArray(detail.images) && detail.images[0]) || '';
    cartStorage.addOrIncrement({
      id: productId,
      name: detail.productName,
      price: listPrice,
      thumb: thumbForCart,
      spec: '默认',
    });
    this.showMallTip({
      message: `${detail.productName} 已加入购物车`,
      icon: `${baseUrl}/img/mall-prompt-xinghuo.svg`,
      duration: 2000,
    });
  },

  onBuyNow() {
    if (!isUserLoggedIn()) {
      promptLoginThenProfile();
      return;
    }
    this.onAddCart();
    const { baseUrl } = this.data;
    this.showMallTip({
      message: '正在跳转结算页面……',
      icon: `${baseUrl}/img/mall-prompt-settle.svg`,
      duration: 1600,
      onEnd: () => {
        wx.navigateTo({ url: '/package-mall/cart/index' });
      },
    });
  },

  onShareAppMessage() {
    const { productId, detail } = this.data;
    const title = detail && detail.productName ? detail.productName : '商品详情';
    let path = '/package-mall/detail/index';
    if (productId) path += `?productId=${productId}`;
    return { title, path };
  },
});
