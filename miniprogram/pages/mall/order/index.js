const config = require('../../../config.js');
const cartStorage = require('../../../utils/cartStorage.js');
const { resolveMediaUrl } = require('../../../utils/resolveMediaUrl.js');
const { getAuthHeaders } = require('../../../utils/auth.js');

function readCheckoutIds() {
  try {
    const raw = wx.getStorageSync('mall_checkout_ids');
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

Page({
  data: {
    baseUrl: config.baseUrl,
    userId: null,
    checkoutIds: [],
    lines: [],
    addresses: [],
    selectedAddressId: null,
    totalAmount: 0,
    totalText: '0.00',
    loading: true,
    submitLoading: false,
    loadError: '',
    needLogin: false,
    needAddress: false,
    submitDisabled: true,
  },

  onLoad() {
    const ids = readCheckoutIds();
    this.setData({ checkoutIds: ids });
  },

  onShow() {
    this.bootstrap();
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onGoProfile() {
    wx.switchTab({ url: '/pages/profile/index' });
  },

  onAddAddress() {
    const { userId } = this.data;
    if (!userId) return;
    wx.navigateTo({ url: '/pages/profile/address/edit' });
  },

  onPickAddress(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;
    this.setData({ selectedAddressId: id });
    this.updateSubmitState();
  },

  updateSubmitState() {
    const { lines, selectedAddressId, submitLoading } = this.data;
    const ok = lines.length > 0 && selectedAddressId && !submitLoading;
    this.setData({ submitDisabled: !ok });
  },

  bootstrap() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    const userId = userInfo.id != null ? Number(userInfo.id) : null;
    const hasToken = !!userInfo.token;

    if (!hasToken || !userId) {
      this.setData({
        loading: false,
        loadError: '请先登录后再结算',
        needLogin: true,
        needAddress: false,
        lines: [],
        addresses: [],
        selectedAddressId: null,
      });
      this.updateSubmitState();
      return;
    }

    this.setData({
      userId,
      needLogin: false,
      loading: true,
      loadError: '',
    });

    const { baseUrl } = this.data;
    const checkoutIds = readCheckoutIds();

    wx.request({
      url: `${baseUrl}/api/mall/cart`,
      method: 'GET',
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401 || body.code === 401) {
          this.setData({
            loading: false,
            loadError: '登录已过期，请重新登录',
            needLogin: true,
            lines: [],
          });
          this.updateSubmitState();
          return;
        }
        if (res.statusCode !== 200 || body.code !== 200 || !Array.isArray(body.data)) {
          this.setData({
            loading: false,
            loadError: body.message || '加载购物车失败',
            lines: [],
          });
          this.updateSubmitState();
          return;
        }

        let rows = body.data;
        if (checkoutIds.length > 0) {
          const set = new Set(checkoutIds.map((x) => String(x)));
          rows = rows.filter((r) => set.has(String(r.productId)));
        }

        const lines = rows.map((r) => {
          const price = Number(r.productPrice);
          return {
            productId: r.productId,
            productName: r.productName,
            quantity: r.quantity,
            productPrice: price,
            priceText: price.toFixed(2),
            thumbUrl: resolveMediaUrl(r.productThumb, baseUrl),
          };
        });

        const totalAmount =
          Math.round(
            lines.reduce((s, it) => s + Number(it.productPrice) * Number(it.quantity), 0) * 100
          ) / 100;

        if (lines.length === 0) {
          this.setData({
            loading: false,
            loadError: '没有可结算的商品，请返回购物车重试',
            lines: [],
            totalAmount: 0,
            totalText: '0.00',
          });
          this.updateSubmitState();
          return;
        }

        this.setData({
          checkoutIds,
          lines,
          totalAmount,
          totalText: totalAmount.toFixed(2),
        });
        this.fetchAddresses(userId, baseUrl);
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: '网络异常，请稍后重试',
          lines: [],
        });
        this.updateSubmitState();
      },
    });
  },

  fetchAddresses(userId, baseUrl) {
    wx.request({
      url: `${baseUrl}/api/user/${userId}/addresses`,
      method: 'GET',
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        const list = res.statusCode === 200 && body.code === 200 && Array.isArray(body.data) ? body.data : [];
        let selectedAddressId = this.data.selectedAddressId;
        const def = list.find((a) => a.isDefault);
        if (def) selectedAddressId = def.id;
        else if (list.length > 0) selectedAddressId = list[0].id;
        else selectedAddressId = null;

        const needAddress = list.length === 0;
        this.setData({
          loading: false,
          addresses: list,
          selectedAddressId,
          needAddress,
          loadError: needAddress ? '请先添加收货地址' : '',
        });
        this.updateSubmitState();
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: '加载地址失败',
          addresses: [],
          selectedAddressId: null,
        });
        this.updateSubmitState();
      },
    });
  },

  onSubmit() {
    const { submitDisabled, submitLoading, selectedAddressId, lines, baseUrl } = this.data;
    if (submitDisabled || submitLoading) return;
    if (!selectedAddressId || lines.length === 0) {
      wx.showToast({ title: '请选择收货地址', icon: 'none' });
      return;
    }

    const productIds = lines.map((l) => l.productId);
    this.setData({ submitLoading: true });
    this.updateSubmitState();

    wx.request({
      url: `${baseUrl}/api/mall/orders`,
      method: 'POST',
      header: getAuthHeaders(true),
      data: {
        addressId: selectedAddressId,
        productIds,
        remark: '',
      },
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 200 && body.code === 200) {
          cartStorage.removeByProductIds(productIds);
          try {
            wx.removeStorageSync('mall_checkout_ids');
          } catch (e) {}
          wx.showToast({ title: '下单成功', icon: 'success' });
          setTimeout(() => {
            wx.navigateBack({ delta: 1 });
          }, 1200);
        } else {
          wx.showToast({ title: body.message || '下单失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络异常', icon: 'none' });
      },
      complete: () => {
        this.setData({ submitLoading: false });
        this.updateSubmitState();
      },
    });
  },
});
