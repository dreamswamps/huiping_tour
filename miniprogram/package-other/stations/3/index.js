const config = require("../../../config");

const STATION_COORDS = {
  station1: { latitude: 30.22075, longitude: 120.038711 },
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
    stationId: 3,
    stationNum: "STATION 03",
    stationTitle: "淬火成钢",
    stationName: "党史馆",
    stationDesc:
      "党史馆内，那盏三角煤油灯见证了无数个不眠之夜。先辈们在昏暗的灯光下研读马列、制定战略，正是这种坚定的信仰，让他们在艰难岁月中淬火成钢。",
    hasSigned: false,
    signedName: "",
    isPlaying: false,
    audioSrc: "",
    isCheckedIn: false,
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
    this.setData({ audioSrc: config.svgsUrl + "/media/3.mp3" });
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
    wx.switchTab({ url: "/pages/index/index" });
  },

  onArScan() {
    wx.showToast({ title: "正在启动AR扫描…", icon: "loading" });
  },

  onSignPledge() {
    if (this.data.hasSigned) {
      wx.showToast({ title: "已签署过承诺书", icon: "none" });
      return;
    }
    const that = this;
    wx.showModal({
      title: "签署守护承诺书",
      content: "请输入您的姓名",
      editable: true,
      placeholderText: "请输入您的姓名",
      success(res) {
        if (res.confirm) {
          const name = (res.content || "").trim();
          if (!name) {
            wx.showToast({ title: "姓名不能为空", icon: "none" });
            return;
          }
          that.setData({ hasSigned: true, signedName: name });
          wx.showToast({ title: "签署成功！", icon: "success" });
        }
      },
    });
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

  onNavigate() {
    const key = config.qqMapKey;
    const referer = "HPT传薪地图";
    const endPoint = JSON.stringify({
      name: "党史馆",
      latitude: 29.240,
      longitude: 118.860,
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
