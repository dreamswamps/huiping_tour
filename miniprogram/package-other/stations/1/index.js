const config = require('../../../config');

const STATION_COORDS = {
  station1: { latitude: 30.22075, longitude: 120.038711 },
  station2: { latitude: 30.221, longitude: 120.039 },
  station3: { latitude: 30.222, longitude: 120.040 },
  station4: { latitude: 30.223, longitude: 120.041 },
  station5: { latitude: 30.224, longitude: 120.042 }
};

const CHECKIN_DISTANCE = 200; // 打卡距离范围（米）

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 使用腾讯地图API获取当前位置
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/location/v1/ip',
      data: {
        key: config.qqMapKey
      },
      success: (res) => {
        if (res.data.status === 0 && res.data.result && res.data.result.location) {
          resolve({
            latitude: res.data.result.location.lat,
            longitude: res.data.result.location.lng
          });
        } else {
          reject(new Error('获取位置失败'));
        }
      },
      fail: () => {
        reject(new Error('网络请求失败'));
      }
    });
  });
}

Page({
  data: {
    baseUrl: config.baseUrl,
    stationId: 1,
    stationNum: 'STATION 01',
    stationTitle: '星火初燃',
    stationName: '陈列馆',
    stationDesc: '1935年，革命先烈在此点燃了革命的第一束火种。这座陈列馆记录了那段激情燃烧的岁月，见证了无数英雄儿女为民族解放抛头颅、洒热血的豪情壮志。',
    isCheckedIn: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
  },

  // 返回地图
  onBackToMap() {
    wx.navigateBack();
  },

  // 返回首页
  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 点亮初心火种 - AR扫描
  onArScan() {
    // TODO: 调用AR扫描功能
    wx.showToast({ title: '正在启动AR扫描…', icon: 'none' });
  },

  // 播放广播剧
  onPlayRadio() {
    // TODO: 跳转播放页面
    wx.showToast({ title: '正在播放《夜袭镇公所》', icon: 'none' });
  },

  // 去这里 - 路线规划到浙江外国语学院
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';

    // 浙江外国语学院（小和山校区）坐标
    const endPoint = JSON.stringify({
      name: '浙江外国语学院',
      latitude: 30.22075,
      longitude: 120.038711
    });

    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`
    });
  },

  // 打卡
  onCheckIn() {
    if (this.data.isCheckedIn) {
      wx.showToast({ title: '已打过卡了', icon: 'none' });
      return;
    }

    const stationKey = `station${this.data.stationId}`;
    const stationCoord = STATION_COORDS[stationKey];
    if (!stationCoord) {
      wx.showToast({ title: '站点配置错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在定位…', mask: true });

    getCurrentLocation()
      .then((location) => {
        wx.hideLoading();
        const distance = calcDistance(
          location.latitude, location.longitude,
          stationCoord.latitude, stationCoord.longitude
        );

        if (distance <= CHECKIN_DISTANCE) {
          this.setData({ isCheckedIn: true });
          wx.showToast({ title: '打卡成功！', icon: 'success' });
        } else {
          wx.showToast({
            title: `距离目的地还有${Math.round(distance)}米，请靠近后再打卡`,
            icon: 'none',
            duration: 2500
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: err.message || '获取位置失败', icon: 'none' });
      });
  }
});
