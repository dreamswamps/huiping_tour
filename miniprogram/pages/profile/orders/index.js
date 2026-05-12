const config = require('../../../config');
const { getAuthHeaders } = require('../../../utils/auth');

const STATUS_MAP = {
  0: { text: '待付款', cls: 'order-status--warn' },
  1: { text: '待发货', cls: 'order-status--warn' },
  2: { text: '已发货', cls: 'order-status--ok' },
  3: { text: '取消中', cls: 'order-status--muted' },
  4: { text: '已完成', cls: 'order-status--muted' },
  5: { text: '已取消', cls: 'order-status--muted' },
};

function statusMeta(status) {
  const s = Number(status);
  const row = STATUS_MAP[s];
  if (row) return { statusText: row.text, statusClass: row.cls };
  return { statusText: '未知', statusClass: 'order-status--muted' };
}

function formatTime(createdAt) {
  if (!createdAt) return '';
  const d = typeof createdAt === 'string' ? createdAt.replace('T', ' ') : createdAt;
  return String(d).slice(0, 16);
}

function itemsPreview(items) {
  if (!Array.isArray(items) || items.length === 0) return '暂无商品明细';
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
  const first = items[0];
  const name = (first && first.name) || '商品';
  if (items.length === 1) return `${name}（共 ${totalQty} 件）`;
  return `${name} 等 ${items.length} 款（共 ${totalQty} 件）`;
}

function mapOrderRow(o) {
  const st = Number(o.status);
  const meta = statusMeta(st);
  const canCancel = st === 0 || st === 1;
  const amt = Number(o.totalAmount);
  return {
    ...o,
    statusText: meta.statusText,
    statusClass: meta.statusClass,
    canCancel,
    itemsPreview: itemsPreview(o.items),
    timeText: formatTime(o.createdAt),
    totalText: Number.isFinite(amt) ? amt.toFixed(2) : '0.00',
  };
}

Page({
  data: {
    baseUrl: config.baseUrl,
    list: [],
    loading: true,
    loadError: '',
  },

  onShow() {
    this.loadOrders();
  },

  onBack() {
    wx.navigateBack();
  },

  loadOrders() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    if (!userInfo.token) {
      this.setData({
        loading: false,
        loadError: '请先登录后查看订单',
        list: [],
      });
      return;
    }

    this.setData({ loading: true, loadError: '' });
    wx.request({
      url: `${config.baseUrl}/api/mall/orders`,
      method: 'GET',
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401 || body.code === 401) {
          this.setData({
            loading: false,
            loadError: '登录已过期，请重新登录',
            list: [],
          });
          return;
        }
        if (res.statusCode !== 200 || body.code !== 200 || !Array.isArray(body.data)) {
          this.setData({
            loading: false,
            loadError: body.message || '加载失败',
            list: [],
          });
          return;
        }
        const list = body.data.map(mapOrderRow);
        this.setData({ loading: false, list, loadError: '' });
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: '网络异常',
          list: [],
        });
      },
    });
  },

  onCancel(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;

    wx.showModal({
      title: '取消订单',
      content: '确定要取消该订单吗？',
      confirmColor: '#c91f37',
      success: (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: '处理中', mask: true });
        wx.request({
          url: `${config.baseUrl}/api/mall/orders/${id}/cancel`,
          method: 'POST',
          header: getAuthHeaders(true),
          data: {},
          success: (res) => {
            wx.hideLoading();
            const body = res.data || {};
            if (res.statusCode === 200 && body.code === 200) {
              wx.showToast({ title: '已取消', icon: 'success' });
              this.loadOrders();
            } else {
              wx.showToast({ title: body.message || '取消失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '网络异常', icon: 'none' });
          },
        });
      },
    });
  },
});
