const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,svgsUrl: config.svgsUrl,

    // 登录状态
    isLogin: false,
    userInfo: {
      id: null,
      nickname: '',
      avatar: '',
      uid: '',
      openid: '',
      token: ''
    },

    // 功能卡片（3宫格）
    funcList: [
      { id: 1, icon: '🗺️', label: '传薪足迹' },
      { id: 2, icon: '🏅', label: '我的徽章' },
      { id: 3, icon: '🎁', label: '我的权益' },
    ],

    // 菜单列表
    menuList: [
      {
        id: 1,
        label: '个人信息',
        iconBg: 'profile-menu-1-bg',
        iconFg: 'profile-menu-1-fg'
      },
      {
        id: 2,
        label: '收货地址',
        iconBg: 'profile-menu-2-bg',
        iconFg: 'profile-menu-2-fg'
      },
      {
        id: 3,
        label: '订单管理',
        iconBg: 'profile-menu-4-bg',
        iconFg: 'profile-menu-4-fg'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
    // 检查登录状态
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({
        isLogin: true,
        userInfo: userInfo
      });
    }
  },

  // 微信一键登录 - 获取用户信息
  onLogin() {
    // 检查是否有缓存的头像和昵称
    const loginCache = wx.getStorageSync('loginCache') || {};
    const hasCache = loginCache.avatar || loginCache.nickname;

    if (hasCache) {
      // 有缓存，直接用 code 登录，不弹窗
      this.doLoginWithCache(loginCache);
    } else {
      // 无缓存，弹窗获取头像昵称
      this.doLoginWithWxAuth();
    }
  },

  // 使用缓存登录（不弹窗）
  doLoginWithCache(cache) {
    wx.showLoading({ title: '登录中...' });

    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          wx.request({
            url: `${config.baseUrl}/api/login`,
            method: 'POST',
            header: {
              'content-type': 'application/json'
            },
            data: {
              code: loginRes.code,
              nickname: cache.nickname || '旅行者',
              avatar: cache.avatar || ''
            },
            success: (res) => {
              wx.hideLoading();

              const body = res.data;
              if (res.statusCode !== 200 || !body) {
                wx.showToast({ title: '请求失败', icon: 'none' });
                return;
              }

              if (body.code === 503) {
                const detail = (body.data && body.data.dbError) || '';
                const content = detail ? `${body.message}\n\n${detail}` : body.message;
                wx.showModal({
                  title: '登录未完成',
                  content: content.length > 800 ? content.slice(0, 800) + '…' : content,
                  showCancel: false
                });
                return;
              }

              const payload = body.data;
              if (body.code === 200 && payload && payload.openid) {
                if (payload.id != null && !payload.token) {
                  wx.showToast({ title: '登录异常：未返回 token', icon: 'none' });
                  return;
                }
                const userInfo = {
                  id: payload.id != null ? payload.id : null,
                  nickname: payload.nickname || cache.nickname || '旅行者',
                  avatar: payload.avatar || cache.avatar || '',
                  uid: payload.uid || '',
                  openid: payload.openid,
                  token: payload.token || ''
                };

                wx.setStorageSync('userInfo', userInfo);

                this.setData({
                  isLogin: true,
                  userInfo
                });

                console.log('登录成功，已同步服务端用户', userInfo);
                wx.showToast({ title: '登录成功', icon: 'success' });
              } else {
                wx.showToast({
                  title: body.message || '登录失败，请重试',
                  icon: 'none'
                });
              }
            },
            fail: () => {
              wx.hideLoading();
              wx.showToast({ title: '网络错误', icon: 'none' });
            }
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '登录失败', icon: 'none' });
      }
    });
  },

  // 微信授权登录（弹窗）
  doLoginWithWxAuth() {
    wx.showLoading({ title: '登录中...' });

    wx.getUserProfile({
      desc: '用于展示您的头像和昵称',
      success: (userRes) => {
        const { avatarUrl, nickName } = userRes.userInfo;

        // 获取登录凭证
        wx.login({
          success: (loginRes) => {
            if (loginRes.code) {
              // 调用后端接口换取 openid
              wx.request({
                url: `${config.baseUrl}/api/login`,
                method: 'POST',
                header: {
                  'content-type': 'application/json'
                },
                data: {
                  code: loginRes.code,
                  nickname: nickName,
                  avatar: avatarUrl
                },
                success: (res) => {
                  wx.hideLoading();

                  const body = res.data;
                  if (res.statusCode !== 200 || !body) {
                    wx.showToast({ title: '请求失败', icon: 'none' });
                    return;
                  }

                  if (body.code === 503) {
                    const detail = (body.data && body.data.dbError) || '';
                    const content = detail ? `${body.message}\n\n${detail}` : body.message;
                    wx.showModal({
                      title: '登录未完成',
                      content: content.length > 800 ? content.slice(0, 800) + '…' : content,
                      showCancel: false
                    });
                    return;
                  }

                  const payload = body.data;
                  if (body.code === 200 && payload && payload.openid) {
                    if (payload.id != null && !payload.token) {
                      wx.showToast({ title: '登录异常：未返回 token', icon: 'none' });
                      return;
                    }
                    const userInfo = {
                      id: payload.id != null ? payload.id : null,
                      nickname: payload.nickname || nickName || '旅行者',
                      avatar: payload.avatar || avatarUrl || '',
                      uid: payload.uid || '',
                      openid: payload.openid,
                      token: payload.token || ''
                    };

                    wx.setStorageSync('userInfo', userInfo);

                    // 更新缓存
                    wx.setStorageSync('loginCache', {
                      avatar: userInfo.avatar,
                      nickname: userInfo.nickname
                    });

                    this.setData({
                      isLogin: true,
                      userInfo
                    });

                    console.log('登录成功，已同步服务端用户', userInfo);
                    wx.showToast({ title: '登录成功', icon: 'success' });
                  } else {
                    wx.showToast({
                      title: body.message || '登录失败，请重试',
                      icon: 'none'
                    });
                  }
                },
                fail: () => {
                  wx.hideLoading();
                  wx.showToast({ title: '网络错误', icon: 'none' });
                }
              });
            } else {
              wx.hideLoading();
              wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '登录失败', icon: 'none' });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取用户信息失败:', err);
        wx.showToast({ title: '请允许获取头像', icon: 'none' });
      }
    });
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 保留头像和昵称缓存
          const userInfo = wx.getStorageSync('userInfo') || {};
          wx.setStorageSync('loginCache', {
            avatar: userInfo.avatar || '',
            nickname: userInfo.nickname || ''
          });

          // 清除登录状态
          wx.removeStorageSync('userInfo');

          // 重置页面状态
          this.setData({
            isLogin: false,
            userInfo: {
              id: null,
              nickname: '',
              avatar: '',
              uid: '',
              openid: '',
              token: ''
            }
          });

          wx.showToast({ title: '已退出登录', icon: 'success' });
        }
      }
    });
  },

  onMenuTap(e) {
    const { id } = e.currentTarget.dataset;
    if (id === 1) {
      if (!this.data.isLogin || !this.data.userInfo.id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/package-profile/info/index' });
      return;
    }
    if (id === 2) {
      if (!this.data.isLogin || !this.data.userInfo.id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      if (!this.data.userInfo.token) {
        wx.showToast({ title: '请重新登录以更新授权', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/package-profile/address/index' });
      return;
    }
    if (id === 3) {
      if (!this.data.isLogin || !this.data.userInfo.id) {
        wx.showToast({ title: '请先登录', icon: 'none' });
        return;
      }
      if (!this.data.userInfo.token) {
        wx.showToast({ title: '请重新登录以更新授权', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: '/package-profile/orders/index' });
      return;
    }
    wx.showToast({ title: `待开发`, icon: 'none' });
  },

  onFuncTap(e) {
    const { id } = e.currentTarget.dataset;
    if (id === 3) {
      wx.navigateTo({ url: '/package-other/benefits/index' });
    } else {
      wx.showToast({ title: `待开发`, icon: 'none' });
    }
  }
});
