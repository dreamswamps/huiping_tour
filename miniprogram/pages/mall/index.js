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

Page({
  data: {
    baseUrl: config.baseUrl,
    products: [],
    loading: true,
    loadError: '',
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.fetchProducts();
  },

  fetchProducts() {
    const { baseUrl } = this.data;
    this.setData({ loading: true, loadError: '' });
    wx.request({
      url: `${baseUrl}/api/mall/products`,
      success: (res) => {
        const body = res.data || {};
        if (body.code !== 200) {
          this.setData({
            loading: false,
            loadError: body.message || '加载失败',
            products: [],
          });
          return;
        }
        const list = Array.isArray(body.data) ? body.data : [];
        const products = list.map((p) => ({
          ...p,
          priceDisplay: Number(p.price).toFixed(2),
          thumbUrl: resolveMediaUrl(p.thumb, baseUrl),
        }));
        this.setData({ loading: false, products, loadError: '' });
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: '网络异常，请检查后端服务',
          products: [],
        });
      },
    });
  },

  onProductCardTap(e) {
    const id = e.currentTarget.dataset.id;
    const price = e.currentTarget.dataset.price;
    const thumb = e.currentTarget.dataset.thumb || '';
    if (!id) return;
    let url = `/package-mall/detail/index?productId=${encodeURIComponent(id)}&price=${encodeURIComponent(price)}`;
    if (thumb) url += `&thumb=${encodeURIComponent(thumb)}`;
    wx.navigateTo({ url });
  },

  showMallTip(opts) {
    const comp = this.selectComponent('#mallFigmaTip');
    if (comp) comp.show(opts);
  },

  onAddCart(e) {
    if (!isUserLoggedIn()) {
      promptLoginThenProfile();
      return;
    }
    const id = e.currentTarget.dataset.id;
    const item = this.data.products.find((p) => String(p.id) === String(id));
    if (!item) return;
    cartStorage.addOrIncrement({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      thumb: item.thumb || '',
      spec: '默认',
    });
    const { baseUrl } = this.data;
    this.showMallTip({
      message: `${item.name} 已加入购物车`,
      icon: `${baseUrl}/img/mall-prompt-xinghuo.svg`,
      duration: 2000,
    });
  },

  onBuyNow(e) {
    if (!isUserLoggedIn()) {
      promptLoginThenProfile();
      return;
    }
    const id = e.currentTarget.dataset.id;
    const item = this.data.products.find((p) => String(p.id) === String(id));
    if (!item) return;
    cartStorage.addOrIncrement({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      thumb: item.thumb || '',
      spec: '默认',
    });
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

  onFabCart() {
    wx.navigateTo({ url: '/package-mall/cart/index' });
  },
});
