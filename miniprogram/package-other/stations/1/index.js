const config = require('../../../config');

const STATION_COORDS = {
  station1: { latitude: 30.22075, longitude: 120.038711 },
  station2: { latitude: 30.221, longitude: 120.039 },
  station3: { latitude: 30.222, longitude: 120.040 },
  station4: { latitude: 30.223, longitude: 120.041 },
  station5: { latitude: 30.224, longitude: 120.042 }
};

const CHECKIN_DISTANCE = 200;

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

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: 'https://apis.map.qq.com/ws/location/v1/ip',
      data: { key: config.qqMapKey },
      success: (res) => {
        if (res.data.status === 0 && res.data.result && res.data.result.location) {
          resolve({ latitude: res.data.result.location.lat, longitude: res.data.result.location.lng });
        } else {
          reject(new Error('获取位置失败'));
        }
      },
      fail: () => reject(new Error('网络请求失败'))
    });
  });
}

Page({
  data: {
    baseUrl: config.baseUrl,svgsUrl: config.svgsUrl,
    stationId: 1,
    stationNum: 'STATION 01',
    stationTitle: '星火初燃',
    stationName: '陈列馆',
    stationDesc: '1935年，革命先烈在此点燃了革命的第一束火种。这座陈列馆记录了那段激情燃烧的岁月，见证了无数英雄儿女为民族解放抛头颅、洒热血的豪情壮举。',
    isCheckedIn: false,
    isPlaying: false,
    audioSrc: ''
  },

  onLoad(options) {
    if (options && options.id) this.setData({ stationId: options.id });
    // 构建音频地址
    this.setData({ audioSrc: config.svgsUrl + '/media/1.MP3' });
    // 创建音频实例
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onError((err) => {
      wx.showToast({ title: '播放失败', icon: 'none' });
      this.setData({ isPlaying: false });
    });
    this.innerAudioContext.onEnded(() => {
      this.setData({ isPlaying: false });
    });
  },

  onUnload() {
    if (this.innerAudioContext) {
      this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
      this.innerAudioContext = null;
    }
  },

  onBackToMap() { wx.navigateBack(); },

  onBackHome() { wx.switchTab({ url: '/pages/index/index' }); },

  onArScan() {
    wx.showToast({ title: '正在启动AR扫描…', icon: 'none' });
  },

  // 播放/暂停广播剧
  onPlayRadio() {
    if (this.data.isPlaying) {
      this.innerAudioContext.pause();
      this.setData({ isPlaying: false });
    } else {
      this.innerAudioContext.src = this.data.audioSrc;
      this.innerAudioContext.play();
      this.setData({ isPlaying: true });
    }
  },

  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({ name: '陈列馆', latitude: 29.258957, longitude: 118.810398 });
    wx.navigateTo({
      url: 'plugin://route-plan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint + '&mode=walking'
    });
  },

  onCheckIn() {
    if (this.data.isCheckedIn) { wx.showToast({ title: '已打过卡了', icon: 'none' }); return; }
    const stationKey = 'station' + this.data.stationId;
    const stationCoord = STATION_COORDS[stationKey];
    if (!stationCoord) { wx.showToast({ title: '站点配置错误', icon: 'none' }); return; }
    wx.showLoading({ title: '正在定位…', mask: true });
    getCurrentLocation()
      .then((location) => {
        wx.hideLoading();
        const distance = calcDistance(location.latitude, location.longitude, stationCoord.latitude, stationCoord.longitude);
        if (distance <= CHECKIN_DISTANCE) {
          this.setData({ isCheckedIn: true });
          wx.showToast({ title: '打卡成功！', icon: 'success' });
        } else {
          wx.showToast({ title: '距离目的地还有' + Math.round(distance) + '米，请靠近后再打卡', icon: 'none', duration: 2500 });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: err.message || '获取位置失败', icon: 'none' });
      });
  }
});
