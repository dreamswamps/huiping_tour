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
    stationId: 2,
    stationNum: 'STATION 02',
    stationTitle: '薪火相传',
    stationName: '红军路',
    stationDesc: '沿着红军当年走过的山路，您将感受到那段艰苦卓绝的岁月。路旁的红豆杉见证了先辈们英勇前行的步伐，用AR扫描这棵千年古树，解锁《雪妹与雪泉》的感人故事。',
    isPlaying: false,
    audioSrc: "",
    isCheckedIn: false
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
    this.setData({ audioSrc: config.svgsUrl + "/media/2.MP3" });
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onError(() => { this.setData({ isPlaying: false }); });
    this.innerAudioContext.onEnded(() => { this.setData({ isPlaying: false }); });
  },

  onUnload() {
    if (this.innerAudioContext) { this.innerAudioContext.stop(); this.innerAudioContext.destroy(); this.innerAudioContext = null; }
  },

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onArScan() {
    wx.showToast({ title: '正在启动AR扫描…', icon: 'none' });
  },

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

  onPlayVideo() {
    wx.previewMedia({
      sources: [{ url: '' + 'https://svgs1.oss-cn-beijing.aliyuncs.com/media/Video1.mp4' + '', type: 'video' }],
      current: 0
    });
  },

  onNavigate() {
    const key = config.qqMapKey;
    const referer = 'HPT传薪地图';
    const endPoint = JSON.stringify({ name: '红军路', latitude: 30.221, longitude: 120.039 });
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
