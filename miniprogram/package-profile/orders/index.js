const config = require("../../config");
const { getAuthHeaders } = require("../../utils/auth");

const STATUS_MAP = {
  0: { text: "待付款", cls: "order-status--warn" },
  1: { text: "待发货", cls: "order-status--warn" },
  2: { text: "已发货", cls: "order-status--ok" },
  3: { text: "取消中", cls: "order-status--muted" },
  4: { text: "已完成", cls: "order-status--muted" },
  5: { text: "已取消", cls: "order-status--muted" },
};

function statusMeta(status) {
  const s = Number(status);
  const row = STATUS_MAP[s];
  if (row) return { statusText: row.text, statusClass: row.cls };
  return { statusText: "未知", statusClass: "order-status--muted" };
}

function formatTime(createdAt) {
  if (!createdAt) return "";
  const d =
    typeof createdAt === "string" ? createdAt.replace("T", " ") : createdAt;
  return String(d).slice(0, 16);
}

function itemsPreview(items) {
  if (!Array.isArray(items) || items.length === 0) return "暂无商品明细";
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
  const first = items[0];
  const name = (first && first.name) || "商品";
  if (items.length === 1) return `${name}（共 ${totalQty} 件）`;
  return `${name} 等 ${items.length} 款（共 ${totalQty} 件）`;
}

function mapOrderRow(o) {
  const st = Number(o.status);
  const meta = statusMeta(st);
  // 只允许待付款取消（待发货走发货流程）
  const canCancel = st === 0;
  const amt = Number(o.totalAmount);
  return {
    ...o,
    statusText: meta.statusText,
    statusClass: meta.statusClass,
    canCancel,
    itemsPreview: itemsPreview(o.items),
    timeText: formatTime(o.createdAt),
    totalText: Number.isFinite(amt) ? amt.toFixed(2) : "0.00",
  };
}

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    list: [],
    loading: true,
    loadError: "",
    // 支付中状态，用于防重复点击
    payingOrderId: null,
    shippingOrderId: null,  // 正在发货的订单ID
    useMockDelivery: true,
  },

  onShow() {
    this.loadOrders();
  },

  onBack() {
    wx.navigateBack();
  },

  onToggleMockDelivery(e) {
    this.setData({ useMockDelivery: !e.detail.value });
  },

  loadOrders() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    if (!userInfo.token) {
      this.setData({
        loading: false,
        loadError: "请先登录后查看订单",
        list: [],
      });
      return;
    }

    this.setData({ loading: true, loadError: "" });
    wx.request({
      url: `${config.baseUrl}/api/mall/orders`,
      method: "GET",
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401 || body.code === 401) {
          this.setData({
            loading: false,
            loadError: "登录已过期，请重新登录",
            list: [],
          });
          return;
        }
        if (
          res.statusCode !== 200 ||
          body.code !== 200 ||
          !Array.isArray(body.data)
        ) {
          this.setData({
            loading: false,
            loadError: body.message || "加载失败",
            list: [],
          });
          return;
        }
        const list = body.data.map(mapOrderRow);
        this.setData({ loading: false, list, loadError: "" });
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: "网络异常",
          list: [],
        });
      },
    });
  },

  // ========== 新增：支付相关 ==========
  onPayOrder(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;
    // 防重复点击
    if (this.data.payingOrderId === id) return;

    // 确认支付弹窗（可选）
    wx.showModal({
      title: "确认支付",
      content: "即将发起微信支付，请确认订单信息无误",
      confirmColor: "#c91f37",
      success: (r) => {
        if (!r.confirm) return;
        this.requestPayment(id);
      },
    });
  },

  requestPayment(orderId) {
    // 设置支付中状态
    this.setData({ payingOrderId: orderId });

    wx.showLoading({ title: "支付准备中", mask: true });

    const { baseUrl } = this.data;
    wx.request({
      url: `${baseUrl}/api/payment/pay`,
      method: "POST",
      header: getAuthHeaders(true),
      data: { orderId: orderId },
      success: (payRes) => {
        wx.hideLoading();
        const payBody = payRes.data || {};
        // 支付接口调用失败
        if (payRes.statusCode !== 200 || payBody.code !== 200) {
          wx.showToast({ title: payBody.message || "支付发起失败", icon: "none" });
          this.setData({ payingOrderId: null });
          // 刷新列表，状态可能已变更
          this.loadOrders();
          return;
        }

        const payData = payBody.data;
        // 【模拟模式】
        if (payData.mock) {
          wx.showToast({ title: "支付成功（模拟）", icon: "success" });
          this.setData({ payingOrderId: null });
          this.loadOrders();
          return;
        }

        // 【真实支付】唤起微信支付
        wx.requestPayment({
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType || "RSA",
          paySign: payData.paySign,
          success: () => {
            wx.showToast({ title: "支付成功", icon: "success" });
            this.setData({ payingOrderId: null });
            this.loadOrders();
          },
          fail: (err) => {
            if (err.errMsg && err.errMsg.includes("cancel")) {
              wx.showToast({ title: "支付取消，订单已保留", icon: "none" });
            } else {
              wx.showToast({ title: "支付失败，请稍后重试", icon: "none" });
            }
            this.setData({ payingOrderId: null });
            // 刷新列表，可能订单状态已变（如过期）
            this.loadOrders();
          },
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "支付请求网络异常", icon: "none" });
        this.setData({ payingOrderId: null });
        this.loadOrders();
      },
    });
  },

  // ========== 原有取消订单逻辑 ==========
  onCancel(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;

    wx.showModal({
      title: "取消订单",
      content: "确定要取消该订单吗？",
      confirmColor: "#c91f37",
      success: (r) => {
        if (!r.confirm) return;
        wx.showLoading({ title: "处理中", mask: true });
        wx.request({
          url: `${config.baseUrl}/api/mall/orders/${id}/cancel`,
          method: "POST",
          header: getAuthHeaders(true),
          data: {},
          success: (res) => {
            wx.hideLoading();
            const body = res.data || {};
            if (res.statusCode === 200 && body.code === 200) {
              wx.showToast({ title: "已取消", icon: "success" });
              this.loadOrders();
            } else {
              wx.showToast({ title: body.message || "取消失败", icon: "none" });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "网络异常", icon: "none" });
          },
        });
      },
    });
  },
  
  // 发货操作
  onShipOrder(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;
    if (this.data.shippingOrderId === id) return; // 防连点

    wx.showModal({
      title: "确认发货",
      content: "确认包裹已打包，为该订单发货？",
      confirmColor: "#c91f37",
      success: (res) => {
        if (!res.confirm) return;

        this.setData({ shippingOrderId: id });
        wx.showLoading({ title: "发货中", mask: true });

        wx.request({
          url: `${this.data.baseUrl}/api/mall/orders/${id}/ship`,
          method: "POST",
          header: getAuthHeaders(true),
          data: { mock: this.data.useMockDelivery },
          success: (res) => {
            wx.hideLoading();
            const body = res.data || {};
            if (res.statusCode === 200 && body.code === 200) {
              wx.showToast({ title: "🚚 已发往物流中心", icon: "success" });
            } else {
              wx.showToast({ title: body.message || "发货失败", icon: "none" });
            }
            this.setData({ shippingOrderId: null });
            this.loadOrders(); // 刷新列表
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "网络异常", icon: "none" });
            this.setData({ shippingOrderId: null });
          },
        });
      },
    });
  },

  // 查看物流（AI演示占位）
  onViewLogistics(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;
    wx.showToast({
      title: '物流功能开发中，敬请期待',
      icon: 'none',
      duration: 2000,
    });
  },
});