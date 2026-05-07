const config = require('../../../config.js');
const cartStorage = require('../../../utils/cartStorage.js');

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
    const items = cartStorage.sortByDisplayOrder(cartStorage.load());
    const totalPrice = sumSelected(items);
    this.setData({
      items,
      isEmpty: items.length === 0,
      selectAll: allSelected(items),
      totalPrice
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
      i.id === id ? { ...i, selected: !i.selected } : i
    );
    this.persist(updated);
  },

  onPlus(e) {
    const id = e.currentTarget.dataset.id;
    const updated = this.data.items.map((i) => {
      if (i.id !== id) return i;
      const q = (i.quantity || 1) + 1;
      return { ...i, quantity: Math.min(q, 99) };
    });
    this.persist(updated);
  },

  onMinus(e) {
    const id = e.currentTarget.dataset.id;
    let updated = this.data.items
      .map((i) => {
        if (i.id !== id) return i;
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
    const tip = this.selectComponent('#mallFigmaTip');
    if (tip) {
      tip.show({
        message: '正在跳转结算页面……',
        icon: `${baseUrl}/img/mall-prompt-settle.svg`,
        duration: 1800,
        onEnd: () => {}
      });
    }
  }
});
