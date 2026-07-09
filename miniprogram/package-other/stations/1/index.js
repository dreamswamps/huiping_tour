const config = require("../../../config");

const STATION_COORDS = {
  station1: { latitude: 29.258957, longitude: 118.810398 },
  station2: { latitude: 29.252, longitude: 118.845 },
  station3: { latitude: 29.240, longitude: 118.860 },
  station4: { latitude: 29.232, longitude: 118.848 },
  station5: { latitude: 29.244, longitude: 118.870 },
};

const CHECKIN_DISTANCE = 200;

function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    wx.getLocation({
      type: "gcj02",
      success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
      fail: () => reject(new Error("请授权位置权限")),
    });
  });
}

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    stationId: 1,
    stationNum: "STATION 01",
    stationTitle: "星火初燃",
    stationName: "陈列馆",
    stationDesc:
      "1935年，革命先烈在此点燃了革命的第一束火种。这座陈列馆记录了那段激情燃烧的岁月，见证了无数英雄儿女为民族解放抛头颅、洒热血的豪情壮举。",
    isCheckedIn: false,
    isPlaying: false,
    audioSrc: "",
  },

  onLoad(options) {
    if (options && options.id) this.setData({ stationId: options.id });
    const remoteUrl = config.svgsUrl + "/media/1.mp3";
    this.setData({ audioSrc: remoteUrl, audioRemote: remoteUrl });
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onError((err) => {
      // 远程播放失败，尝试下载到本地
      const remote = this.data.audioRemote;
      if (remote && this.data.audioSrc === remote) {
        // wx.showLoading({ title: "加载中…" });
        wx.downloadFile({
          url: remote,
          success: (res) => {
            wx.hideLoading();
            this.setData({ audioSrc: res.tempFilePath });
            this.innerAudioContext.src = res.tempFilePath;
            this.innerAudioContext.play();
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: "播放失败", icon: "none" });
            this.setData({ isPlaying: false });
          }
        });
      } else {
        wx.showToast({ title: "播放失败", icon: "none" });
        this.setData({ isPlaying: false });
      }
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

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({ url: "/pages/index/index" });
  },

  onArScan() {
    wx.showToast({ title: "正在启动AR扫描…", icon: "none" });
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
    const referer = "HPT传薪地图";
    const endPoint = JSON.stringify({
      name: "陈列馆",
      latitude: 29.258957,
      longitude: 118.810398,
    });
    wx.navigateTo({
      url:
        "plugin://route-plan/index?key=" +
        key +
        "&referer=" +
        referer +
        "&endPoint=" +
        endPoint +
        "&mode=walking",
    });
  },

  onCheckIn() {
    if (this.data.isCheckedIn) {
      wx.showToast({ title: "已打过卡了", icon: "none" });
      return;
    }
    const stationKey = "station" + this.data.stationId;
    const stationCoord = STATION_COORDS[stationKey];
    if (!stationCoord) {
      wx.showToast({ title: "站点配置错误", icon: "none" });
      return;
    }
    wx.showLoading({ title: "正在定位…", mask: true });
    getCurrentLocation()
      .then((location) => {
        wx.hideLoading();
        const distance = calcDistance(
          location.latitude,
          location.longitude,
          stationCoord.latitude,
          stationCoord.longitude,
        );
        if (distance <= CHECKIN_DISTANCE) {
          this.setData({ isCheckedIn: true });
          wx.showToast({ title: "打卡成功！", icon: "success" });
        } else {
          wx.showToast({
            title:
              "距离目的地还有" + Math.round(distance) + "米，请靠近后再打卡",
            icon: "none",
            duration: 2500,
          });
        }
      })
      .catch((err) => {
        wx.hideLoading();
        wx.showToast({ title: err.message || "获取位置失败", icon: "none" });
      });
  },
});
