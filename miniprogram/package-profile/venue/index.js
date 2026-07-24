const config = require("../../config");
const { getAuthHeaders } = require("../../utils/auth");

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    loading: false,
    loadError: "",
    list: [],
  },

  onShow() {
    this.loadVenueList();
  },

  onBack() {
    wx.navigateBack();
  },

  loadVenueList() {
    const userInfo = wx.getStorageSync("userInfo") || {};
    if (!userInfo.token) {
      this.setData({
        loading: false,
        loadError: "请先登录后查看预约",
        list: [],
      });
      return;
    }

    this.setData({ loading: true, loadError: "" });
    wx.request({
      url: `${config.baseUrl}/api/venue/bookings`,
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
        if (res.statusCode !== 200 || body.code !== 200) {
          this.setData({
            loading: false,
            loadError: body.message || "加载失败",
            list: [],
          });
          return;
        }
        const list = Array.isArray(body.data) ? body.data : [];
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
});
