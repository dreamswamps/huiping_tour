const config = require('../../../config');
const { getAuthHeaders } = require('../../../utils/auth');

Page({
  data: {
    baseUrl: config.baseUrl,
    userId: null,
    addressId: null,
    isEdit: false,
    receiverName: '',
    receiverPhone: '',
    region: [],
    regionText: '',
    province: '',
    city: '',
    district: '',
    detailAddress: '',
    label: '',
    isDefault: false,
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo');
    const userId = userInfo && userInfo.id != null ? userInfo.id : null;
    const hasToken = !!(userInfo && userInfo.token);
    this.setData({ userId });
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    if (!hasToken) {
      wx.showToast({ title: '请重新登录后再试', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    const id = options.id ? Number(options.id) : null;
    if (id && !Number.isNaN(id)) {
      this.setData({ addressId: id, isEdit: true });
      this.loadDetail(id);
    }
  },

  onBack() {
    wx.navigateBack();
  },

  loadDetail(addressId) {
    wx.showLoading({ title: '加载中' });
    wx.request({
      url: `${config.baseUrl}/api/user/${this.data.userId}/addresses/${addressId}`,
      method: 'GET',
      header: getAuthHeaders(false),
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode !== 200 || res.data.code !== 200 || !res.data.data) {
          wx.showToast({ title: (res.data && res.data.message) || '加载失败', icon: 'none' });
          return;
        }
        const d = res.data.data;
        const region = [d.province, d.city, d.district].filter(Boolean);
        this.setData({
          receiverName: d.receiverName || '',
          receiverPhone: d.receiverPhone || '',
          province: d.province || '',
          city: d.city || '',
          district: d.district || '',
          region: region.length === 3 ? region : [],
          regionText: region.length === 3 ? region.join(' ') : '',
          detailAddress: d.detailAddress || '',
          label: d.label || '',
          isDefault: !!d.isDefault,
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    if (field) {
      this.setData({ [field]: value });
    }
  },

  onRegionChange(e) {
    const v = e.detail.value;
    if (!v || v.length < 3) return;
    this.setData({
      region: v,
      regionText: v.join(' '),
      province: v[0],
      city: v[1],
      district: v[2],
    });
  },

  onDefaultChange(e) {
    this.setData({ isDefault: e.detail.value });
  },

  onSave() {
    const {
      userId,
      addressId,
      isEdit,
      receiverName,
      receiverPhone,
      province,
      city,
      district,
      detailAddress,
      label,
      isDefault,
    } = this.data;

    if (!receiverName.trim()) {
      wx.showToast({ title: '请填写收货人', icon: 'none' });
      return;
    }
    if (!receiverPhone.trim() || receiverPhone.trim().length < 11) {
      wx.showToast({ title: '请填写正确手机号', icon: 'none' });
      return;
    }
    if (!province || !city || !district) {
      wx.showToast({ title: '请选择所在地区', icon: 'none' });
      return;
    }
    if (!detailAddress.trim()) {
      wx.showToast({ title: '请填写详细地址', icon: 'none' });
      return;
    }

    const payload = {
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      province,
      city,
      district,
      detailAddress: detailAddress.trim(),
      postalCode: '',
      label: (label || '').trim(),
      isDefault,
    };

    const url = isEdit
      ? `${config.baseUrl}/api/user/${userId}/addresses/${addressId}`
      : `${config.baseUrl}/api/user/${userId}/addresses`;
    const method = isEdit ? 'PUT' : 'POST';

    wx.showLoading({ title: '保存中' });
    wx.request({
      url,
      method,
      header: getAuthHeaders(true),
      data: payload,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({ title: '保存成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 400);
        } else {
          wx.showToast({ title: (res.data && res.data.message) || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      },
    });
  },
});
