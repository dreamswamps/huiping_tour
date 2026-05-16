const config = require('../../config.js');
const cartStorage = require('../../utils/cartStorage.js');
const { resolveMediaUrl } = require('../../utils/resolveMediaUrl.js');
const { getAuthHeaders, isUserLoggedIn } = require('../../utils/auth.js');

function sumSelected(items) {
  return items.reduce((s, it) => {
    if (!it.selected) return s;
    return s + it.price * (it.quantity || 1);
  }, 0);
}

function allSelected(items) {
  return items.length > 0 && items.every((i) => i.selected);
}

Page({
  data: {
    baseUrl: config.baseUrl,
    items: [],
    selectAll: false,
    totalPrice: 0,
    isEmpty: true
  },

  onShow() {
    this.refreshCart();
  },

  refreshCart() {
    const { baseUrl } = this.data;
    const raw = cartStorage.sortByDisplayOrder(cartStorage.load());
    const items = raw.map((it) => ({
      ...it,
      thumbUrl: resolveMediaUrl(it.thumb, baseUrl),
    }));
    const totalPrice = sumSelected(items);
    this.setData({
      items,
      isEmpty: items.length === 0,
      selectAll: allSelected(items),
      totalPrice,
    });
  },

  persist(items) {
    cartStorage.save(items);
    const totalPrice = sumSelected(items);
    this.setData({
      items,
      isEmpty: items.length === 0,
      selectAll: allSelected(items),
      totalPrice
    });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onToggleAll() {
    const { items } = this.data;
    if (items.length === 0) return;
    const next = !allSelected(items);
    const updated = items.map((i) => ({ ...i, selected: next }));
    this.persist(updated);
  },

  onToggleItem(e) {
    const id = e.currentTarget.dataset.id;
    const updated = this.data.items.map((i) =>
      String(i.id) === String(id) ? { ...i, selected: !i.selected } : i
    );
    this.persist(updated);
  },

  onPlus(e) {
    const id = e.currentTarget.dataset.id;
    const updated = this.data.items.map((i) => {
      if (String(i.id) !== String(id)) return i;
      const q = (i.quantity || 1) + 1;
      return { ...i, quantity: Math.min(q, 99) };
    });
    this.persist(updated);
  },

  onMinus(e) {
    const id = e.currentTarget.dataset.id;
    let updated = this.data.items
      .map((i) => {
        if (String(i.id) !== String(id)) return i;
        const q = (i.quantity || 1) - 1;
        return { ...i, quantity: q };
      })
      .filter((i) => (i.quantity || 0) > 0);
    this.persist(updated);
  },

  onCheckout() {
    const { items, totalPrice, baseUrl } = this.data;
    if (items.length === 0) {
      wx.showToast({ title: '购物车为空', icon: 'none' });
      return;
    }
    const hasSel = items.some((i) => i.selected);
    if (!hasSel || totalPrice <= 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' });
      return;
    }
    if (!isUserLoggedIn()) {
      wx.showToast({ title: '请先登录后再结算', icon: 'none' });
      return;
    }

    const syncPayload = items.map((i) => ({
      productId: i.id,
      name: i.name,
      price: i.price,
      thumb: i.thumb || '',
      quantity: i.quantity || 1,
    }));
    const selectedIds = items.filter((i) => i.selected).map((i) => i.id);

    wx.showLoading({ title: '同步购物车…', mask: true });
    wx.request({
      url: `${baseUrl}/api/mall/cart/sync`,
      method: 'PUT',
      header: getAuthHeaders(true),
      data: { items: syncPayload },
      success: (res) => {
        wx.hideLoading();
        const body = res.data || {};
        if (res.statusCode !== 200 || body.code !== 200) {
          wx.showToast({ title: body.message || '同步失败', icon: 'none' });
          return;
        }
        try {
          wx.setStorageSync('mall_checkout_ids', selectedIds);
        } catch (e) {
          wx.removeStorageSync('mall_checkout_ids');
        }
        wx.navigateTo({ url: '/package-mall/order/index' });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'none' });
      },
    });
  },
});
