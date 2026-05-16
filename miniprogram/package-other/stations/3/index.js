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
    stationId: 3,
    stationNum: 'STATION 03',
    stationTitle: '淬火成钢',
    stationName: '党史馆',
    stationDesc: '党史馆内，那盏三角煤油灯见证了无数个不眠之夜。先辈们在昏暗的灯光下研读马列、制定战略，正是这种坚定的信仰，让他们在艰难岁月中淬火成钢。',
    hasSigned: false,
    isCheckedIn: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
  },

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // AR扫描采集煤油灯
  onArScan() {
    wx.showToast({
      title: '正在启动AR扫描…',
      icon: 'loading'
    });
  },

  // 签署守护承诺书
  onSignPledge() {
    if (this.data.hasSigned) {
      wx.showToast({ title: '已签署过承诺书', icon: 'none' });
      return;
    }
    this.setData({ hasSigned: true });
    wx.showToast({
      title: '签署成功！',
      icon: 'success'
    });
  },

  // 去这里 - 路线规划
  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({
      name: '党史馆',
      latitude: 30.222,
      longitude: 120.040
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
