const config = require('../../config');
const { getAuthHeaders } = require('../../utils/auth');

Page({
  data: {
    baseUrl: config.baseUrl,
    userId: null,
    list: [],
    loading: true,
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo && userInfo.id != null ? userInfo.id : null;
    const hasToken = !!(userInfo && userInfo.token);
    this.setData({ userId });
    if (!userId) {
      this.setData({ list: [], loading: false });
      return;
    }
    if (!hasToken) {
      this.setData({ list: [], loading: false });
      wx.showToast({ title: '请重新登录后再管理地址', icon: 'none' });
      return;
    }
    this.loadList();
  },

  onBack() {
    wx.navigateBack();
  },

  loadList() {
    const { userId } = this.data;
    if (!userId) return;
    this.setData({ loading: true });
    wx.request({
      url: `${config.baseUrl}/api/user/${userId}/addresses`,
      method: 'GET',
      header: getAuthHeaders(false),
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200 && Array.isArray(res.data.data)) {
          this.setData({ list: res.data.data, loading: false });
        } else {
          this.setData({ loading: false });
          wx.showToast({ title: (res.data && res.data.message) || '加载失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
    });
  },

  onAdd() {
    if (!this.data.userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/package-profile/address/edit' });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({ url: `/package-profile/address/edit?id=${id}` });
  },

  onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.list.find((x) => x.id === id);
    if (!item || !this.data.userId) return;

    wx.showLoading({ title: '设置中' });
    wx.request({
      url: `${config.baseUrl}/api/user/${this.data.userId}/addresses/${id}`,
      method: 'PUT',
      header: getAuthHeaders(true),
      data: {
        receiverName: item.receiverName,
        receiverPhone: item.receiverPhone,
        province: item.province,
        city: item.city,
        district: item.district,
        detailAddress: item.detailAddress,
        postalCode: item.postalCode || '',
        label: item.label || '',
        isDefault: true,
      },
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ title: '已设为默认', icon: 'success' });
          this.loadList();
        } else {
          wx.showToast({ title: (res.data && res.data.message) || '操作失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
    });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || !this.data.userId) return;
    wx.showModal({
      title: '删除地址',
      content: '确定删除该收货地址吗？',
      confirmColor: '#C91F37',
      success: (r) => {
        if (!r.confirm) return;
        wx.request({
          url: `${config.baseUrl}/api/user/${this.data.userId}/addresses/${id}`,
          method: 'DELETE',
          header: getAuthHeaders(false),
          success: (res) => {
            if (res.statusCode === 200 && res.data.code === 200) {
              wx.showToast({ title: '已删除', icon: 'success' });
              this.loadList();
            } else {
              wx.showToast({ title: (res.data && res.data.message) || '删除失败', icon: 'none' });
            }
          },
          fail: () => wx.showToast({ title: '网络错误', icon: 'none' }),
        });
      },
    });
  },
});
