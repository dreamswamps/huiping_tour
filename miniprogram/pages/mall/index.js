const config = require('../../config.js');
const cartStorage = require('../../utils/cartStorage.js');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl.js');

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
    let url = `/pages/mall/detail/index?productId=${encodeURIComponent(id)}&price=${encodeURIComponent(price)}`;
    if (thumb) url += `&thumb=${encodeURIComponent(thumb)}`;
    wx.navigateTo({ url });
  },

  showMallTip(opts) {
    const comp = this.selectComponent('#mallFigmaTip');
    if (comp) comp.show(opts);
  },

  onAddCart(e) {
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
        wx.navigateTo({ url: '/pages/mall/cart/index' });
      },
    });
  },

  onFabCart() {
    wx.navigateTo({ url: '/pages/mall/cart/index' });
  },
});
