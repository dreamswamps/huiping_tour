const config = require("../../../config");

const STATION_COORDS = {
  station1: { latitude: 30.22075, longitude: 120.038711 },
  station2: { latitude: 29.252, longitude: 118.845 },
  station3: { latitude: 29.240, longitude: 118.860 },
  station4: { latitude: 29.232, longitude: 118.848 },
  station5: { latitude: 29.244, longitude: 118.870 },
};

const CHECKIN_DISTANCE = 200; // 打卡距离范围（米）

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

// 使用腾讯地图API获取当前位置
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
    stationId: 4,
    stationNum: "STATION 04",
    stationTitle: "丰碑永铸",
    stationName: "纪念碑",
    stationDesc:
      "这座巍峨的纪念碑，承载着无数先烈的英魂。他们用生命铸就了民族的丰碑，用鲜血染红了共和国的旗帜。在此献花致敬，传递革命火把，让精神永续长燃。",
    isPlaying: false,
    audioSrc: "",
    certUnlocked: false,
    isCheckedIn: false,
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
    this.setData({ audioSrc: config.svgsUrl + "/media/4.mp3" });
    this.innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext.onError(() => {
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

  onBackToMap() {
    wx.navigateBack();
  },

  onBackHome() {
    wx.switchTab({
      url: "/pages/index/index",
    });
  },

  // 献花AR扫描
  onArFlower() {
    wx.showToast({ title: "启动AR献花…", icon: "loading" });
  },

  // 传递薪火
  onPassTorch() {
    wx.showToast({ title: "举起手机感应传递…", icon: "none" });
  },

  // 去这里 - 路线规划
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
      name: "纪念碑",
      latitude: 29.232,
      longitude: 118.848,
    });
    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`,
    });
  },

  // 打卡
  onCheckIn() {
    if (this.data.isCheckedIn) {
      wx.showToast({ title: "已打过卡了", icon: "none" });
      return;
    }

    const stationKey = `station${this.data.stationId}`;
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
            title: `距离目的地还有${Math.round(distance)}米，请靠近后再打卡`,
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
