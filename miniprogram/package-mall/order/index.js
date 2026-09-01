const config = require("../../config.js");
const cartStorage = require("../../utils/cartStorage.js");
const { resolveMediaUrl } = require("../../utils/resolveMediaUrl.js");
const { getAuthHeaders, isUserLoggedIn } = require("../../utils/auth.js");

function readCheckoutIds() {
  try {
    const raw = wx.getStorageSync("mall_checkout_ids");
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    userId: null,
    checkoutIds: [],
    lines: [],
    addresses: [],
    selectedAddressId: null,
    totalAmount: 0,
    totalText: "0.00",
    loading: true,
    submitLoading: false,
    loadError: "",
    needLogin: false,
    needAddress: false,
    submitDisabled: true,
    //  paying决定是否唤起支付，避免同时唤起多个支付弹窗
    paying: false,
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
    wx.switchTab({ url: "/pages/profile/index" });
  },

  onAddAddress() {
    const { userId } = this.data;
    if (!userId) return;
    wx.navigateTo({ url: "/package-profile/address/edit" });
  },

  onPickAddress(e) {
    const id = Number(e.currentTarget.dataset.id);
    if (!Number.isInteger(id) || id < 1) return;
    this.setData({ selectedAddressId: id });
    this.updateSubmitState();
  },

  updateSubmitState() {
    const { lines, selectedAddressId, submitLoading, paying } = this.data;
    // 如果存在支付中、加载中、无地址/商品，禁用
    const ok = lines.length > 0 && selectedAddressId && !submitLoading && !paying;
    this.setData({ submitDisabled: !ok });
  },

  bootstrap() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    const userId = userInfo.id != null ? Number(userInfo.id) : null;

    if (!isUserLoggedIn() || !userId) {
      this.setData({
        loading: false,
        loadError: "请先登录后再结算",
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
      loadError: "",
    });

    const { baseUrl } = this.data;
    const checkoutIds = readCheckoutIds();

    wx.request({
      url: `${baseUrl}/api/mall/cart`,
      method: "GET",
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode === 401 || body.code === 401) {
          this.setData({
            loading: false,
            loadError: "登录已过期，请重新登录",
            needLogin: true,
            lines: [],
          });
          this.updateSubmitState();
          return;
        }
        if (
          res.statusCode !== 200 ||
          body.code !== 200 ||
          !Array.isArray(body.data)
        ) {
          this.setData({
            loading: false,
            loadError: body.message || "加载购物车失败",
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
            lines.reduce(
              (s, it) => s + Number(it.productPrice) * Number(it.quantity),
              0,
            ) * 100,
          ) / 100;

        if (lines.length === 0) {
          this.setData({
            loading: false,
            loadError: "没有可结算的商品，请返回购物车重试",
            lines: [],
            totalAmount: 0,
            totalText: "0.00",
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
          loadError: "网络异常，请稍后重试",
          lines: [],
        });
        this.updateSubmitState();
      },
    });
  },

  fetchAddresses(userId, baseUrl) {
    wx.request({
      url: `${baseUrl}/api/user/${userId}/addresses`,
      method: "GET",
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        const list =
          res.statusCode === 200 &&
          body.code === 200 &&
          Array.isArray(body.data)
            ? body.data
            : [];
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
          loadError: needAddress ? "请先添加收货地址" : "",
        });
        this.updateSubmitState();
      },
      fail: () => {
        this.setData({
          loading: false,
          loadError: "加载地址失败",
          addresses: [],
          selectedAddressId: null,
        });
        this.updateSubmitState();
      },
    });
  },

  // 该接口原用于生成并提交订单信息
  // 现升级至支持调用微信支付
  onSubmit() {
    const { submitDisabled, submitLoading, selectedAddressId, lines, baseUrl, paying } = this.data;
    if (submitDisabled || submitLoading || paying) return;

    // 校验收货地址
    if (!selectedAddressId || lines.length === 0) {
      wx.showToast({ title: "请选择收货地址", icon: "none" });
      return;
    }

    // 进入加载状态
    const productIds = lines.map((l) => l.productId);
    this.setData({ submitLoading: true });
    // this.updateSubmitState();

    // 生成订单
    wx.request({
      url: `${baseUrl}/api/mall/orders`,
      method: "POST",
      header: getAuthHeaders(true),
      data: {
        addressId: selectedAddressId,
        productIds,
        remark: "",
      },
      // 由于需进行方法嵌套，不建议使用completet统一更新状态
      success: (res) => {
        const body = res.data || {};

        // 异常返回状态码
        if (res.statusCode !== 200 || body.code !== 200) {
          wx.showToast({ title: body.message || "下单失败", icon: "none" });
          this.setData({ submitLoading: false, paying: false });
          this.updateSubmitState();
          return;
        }

        // 清除本地购物车缓存
        cartStorage.removeByProductIds(productIds);
        try {
          wx.removeStorageSync("mall_checkout_ids");
        } catch (e) {}

        // 调用支付请求
        const orderId = body.data?.id
        this.requestPayment(orderId);
      },
      fail: () => {
        wx.showToast({ title: "网络异常", icon: "none" });
        this.setData({ submitLoading: false });
        this.updateSubmitState();
      },
    });
  },

  requestPayment(orderId) {
    const { baseUrl } = this.data;
    wx.request({
      url: `${baseUrl}/api/payment/pay`,
      method: "POST",
      header: getAuthHeaders(true),
      data: { orderId: orderId }, 
      success: (payRes) => {
        const payBody = payRes.data || {};
        // 支付接口调用失败（如库存突然不足，后端会返回400）
        if (payRes.statusCode !== 200 || payBody.code !== 200) {
          wx.showToast({ title: payBody.message || "支付发起失败", icon: "none" });
          // 支付失败，跳转至订单列表页，让用户手动点击“去支付”
          wx.redirectTo({ url: "/package-profile/orders/index" }); 
          // 注意：由于页面即将跳转，无需重置 submitLoading，但为了严谨仍重置
          this.setData({ submitLoading: false, paying: false });
          return;
        }
  
        const payData = payBody.data;
        // 【模拟模式】如果后端开启了 ISMOCK=true
        if (payData.mock) {
          wx.showToast({ title: "支付成功（模拟）", icon: "success" });
          // 模拟成功，跳转到订单列表页
          wx.redirectTo({ url: "/package-profile/orders/index" });
          this.setData({ submitLoading: false, paying: false });
          return;
        }
  
        // 【真实支付】唤起微信支付面板
        wx.requestPayment({
          timeStamp: payData.timeStamp,
          nonceStr: payData.nonceStr,
          package: payData.package,
          signType: payData.signType || "RSA",
          paySign: payData.paySign,
          success: () => {
            // 支付成功：跳转到订单列表（或订单详情页）
            wx.showToast({ title: "支付成功", icon: "success" });
            // 如果您有订单详情页，可以跳转详情；如果没有，跳转列表让用户看到状态变更
            wx.redirectTo({ url: "/package-profile/orders/index" });
          },
          fail: (err) => {
            // 用户取消支付 或 支付失败
            if (err.errMsg && err.errMsg.includes("cancel")) {
              wx.showToast({ title: "支付取消，订单已保留", icon: "none" });
            } else {
              wx.showToast({ title: "支付失败，请稍后重试", icon: "none" });
            }
            // 支付中断/失败：跳转到订单列表页，用户可点击“去支付”继续
            wx.redirectTo({ url: "/package-profile/orders/index" });
          },
          complete: () => {
            // 无论支付成功或失败，重置加载状态（虽然页面已跳转，但以防万一）
            this.setData({ submitLoading: false, paying: false });
          }
        });
      },
      fail: () => {
        wx.showToast({ title: "支付请求网络异常", icon: "none" });
        wx.redirectTo({ url: "/package-profile/orders/index" });
        this.setData({ submitLoading: false, paying: false });
      },
    });
  },
});
