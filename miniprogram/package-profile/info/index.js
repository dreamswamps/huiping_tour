const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,svgsUrl: config.svgsUrl,

    userInfo: {
      id: null,
      nickname: '',
      avatar: '',
      score: 0,
      uid: '',
      created_at: ''
    },

    isEditing: false,
    editForm: {
      nickname: ''
    }
  },

  onShow() {
    // 编辑中不重新拉取，避免打断输入
    if (this.data.isEditing) return;
    this.loadUserInfo();
  },

  // 加载用户信息
  loadUserInfo() {
    const localInfo = wx.getStorageSync('userInfo');
    if (!localInfo || !localInfo.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.request({
      url: `${config.baseUrl}/api/user/profile`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${localInfo.token}`
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.code === 200) {
          const data = res.data.data;
          const userInfo = {
            id: data.id,
            nickname: data.nickname || '',
            avatar: data.avatar || '',
            score: data.score || 0,
            uid: data.uid || '',
            created_at: data.created_at || ''
          };
          this.setData({ userInfo });
          // 更新本地缓存
          wx.setStorageSync('userInfo', { ...localInfo, ...userInfo });
        } else if (res.statusCode === 401) {
          wx.showToast({ title: '登录已过期', icon: 'none' });
        } else {
          wx.showToast({ title: '获取信息失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 选择头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      'userInfo.avatar': avatarUrl,
      'editForm.avatar': avatarUrl
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'editForm.nickname': e.detail.value
    });
  },

  // 开始编辑
  onStartEdit() {
    this.setData({
      isEditing: true,
      editForm: {
        nickname: this.data.userInfo.nickname || ''
      }
    });
  },

  // 取消编辑
  onCancelEdit() {
    this.setData({
      isEditing: false,
      editForm: {
        nickname: ''
      }
    });
  },

  // 保存修改
  onSaveEdit() {
    const { editForm, userInfo } = this.data;

    if (!editForm.nickname || editForm.nickname.trim().length === 0) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    if (editForm.nickname.length > 100) {
      wx.showToast({ title: '昵称不能超过100字', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    const localInfo = wx.getStorageSync('userInfo');

    wx.request({
      url: `${config.baseUrl}/api/user/profile`,
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${localInfo.token}`
      },
      data: {
        nickname: editForm.nickname.trim(),
        avatar: editForm.avatar || userInfo.avatar
      },
      success: (res) => {
        wx.hideLoading();

        if (res.statusCode !== 200 || !res.data) {
          wx.showToast({ title: '保存失败', icon: 'none' });
          return;
        }

        const body = res.data;
        if (body.code === 200) {
          const updatedInfo = {
            ...localInfo,
            nickname: editForm.nickname.trim(),
            avatar: editForm.avatar || userInfo.avatar
          };

          wx.setStorageSync('userInfo', updatedInfo);

          this.setData({
            isEditing: false,
            userInfo: {
              ...this.data.userInfo,
              nickname: editForm.nickname.trim(),
              avatar: editForm.avatar || userInfo.avatar
            }
          });

          wx.showToast({ title: '保存成功', icon: 'success' });
        } else {
          wx.showToast({
            title: body.message || '保存失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 保存头像和昵称
  onSaveProfile() {
    const { userInfo, isEditing, editForm } = this.data;
    const localInfo = wx.getStorageSync('userInfo');

    if (!localInfo || !localInfo.token) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    // 如果是编辑模式，使用 editForm 的值
    let nickname = userInfo.nickname;
    let avatar = userInfo.avatar;
    if (isEditing) {
      nickname = editForm.nickname || nickname;
      avatar = editForm.avatar || avatar;
    }

    wx.showLoading({ title: '保存中...' });

    wx.request({
      url: `${config.baseUrl}/api/user/profile`,
      method: 'PUT',
      header: {
        'content-type': 'application/json',
        'Authorization': `Bearer ${localInfo.token}`
      },
      data: {
        nickname: nickname,
        avatar: avatar
      },
      success: (res) => {
        wx.hideLoading();

        if (res.statusCode !== 200 || !res.data) {
          wx.showToast({ title: '保存失败', icon: 'none' });
          return;
        }

        const body = res.data;
        if (body.code === 200) {
          const updatedInfo = {
            ...localInfo,
            nickname: nickname,
            avatar: avatar
          };
          wx.setStorageSync('userInfo', updatedInfo);

          // 退出编辑模式并更新显示
          this.setData({
            isEditing: false,
            userInfo: {
              ...this.data.userInfo,
              nickname: nickname,
              avatar: avatar
            },
            editForm: { nickname: '' }
          });

          wx.showToast({ title: '保存成功', icon: 'success' });
        } else {
          wx.showToast({ title: body.message || '保存失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});
