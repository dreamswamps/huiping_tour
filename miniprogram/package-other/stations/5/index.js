const config = require("../../../config");
const { getAuthHeaders, isUserLoggedIn } = require("../../../utils/auth");

const STATION_COORDS = {
  station1: { latitude: 30.22075, longitude: 120.038711 },
  station2: { latitude: 29.252, longitude: 118.845 },
  station3: { latitude: 29.24, longitude: 118.86 },
  station4: { latitude: 29.232, longitude: 118.848 },
  station5: { latitude: 29.244, longitude: 118.87 },
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
      success: (res) =>
        resolve({ latitude: res.latitude, longitude: res.longitude }),
      fail: () => reject(new Error("请授权位置权限")),
    });
  });
}

function formatRelativeTime(createdAt) {
  if (!createdAt) return "";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin}分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}小时前`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}天前`;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function mapDeclarations(list) {
  return (list || []).map((item) => ({
    id: item.id,
    content: item.content,
    time: formatRelativeTime(item.createdAt),
  }));
}

function buildScrollLists(declarations) {
  if (declarations.length <= 1) {
    return { primary: declarations, secondary: [] };
  }
  return {
    primary: declarations.map((item) => ({ ...item, loopKey: `a-${item.id}` })),
    secondary: declarations.map((item) => ({
      ...item,
      loopKey: `b-${item.id}`,
    })),
  };
}

function calcScrollDuration(count) {
  if (count <= 1) return 0;
  return Math.max(count * 3, 10);
}

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    stationId: 5,
    stationNum: "STATION 05",
    stationTitle: "薪火续燃",
    stationName: "红军村",
    stationDesc:
      "红军村是传薪之旅的终点，也是新的起点。在这里发布您的传薪宣言，让革命精神在您手中继续燃烧，让新的火焰照亮未来的征程。",
    isPlaying: false,
    audioSrc: "",
    declarationText: "",
    maxLen: 50,
    declarations: [],
    scrollPrimary: [],
    scrollSecondary: [],
    wallLoading: false,
    wallEmpty: false,
    wallScrollEnabled: false,
    scrollDuration: 10,
    publishing: false,
    isCheckedIn: false,
  },

  onLoad(options) {
    if (options && options.id) {
      this.setData({ stationId: options.id });
    }
    this.loadDeclarations();
    this.setData({ audioSrc: config.svgsUrl + "/media/5.MP3" });
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
      try {
        this.innerAudioContext.stop();
      } catch (_) {}
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
      name: "红军村",
      latitude: 29.244,
      longitude: 118.87,
    });
    wx.navigateTo({
      url: `plugin://route-plan/index?key=${key}&referer=${referer}&endPoint=${endPoint}&mode=walking`,
    });
  },

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

  onInputDecl(e) {
    this.setData({ declarationText: e.detail.value });
  },

  onPublish() {
    const { declarationText, maxLen, baseUrl, publishing } = this.data;
    if (publishing) return;

    const text = declarationText.trim();
    if (!text) {
      wx.showToast({ title: "请输入传薪宣言", icon: "none" });
      return;
    }
    if (text.length > maxLen) {
      wx.showToast({ title: `最多${maxLen}字`, icon: "none" });
      return;
    }
    if (!isUserLoggedIn()) {
      wx.showToast({ title: "请先登录", icon: "none" });
      setTimeout(() => {
        wx.switchTab({ url: "/pages/profile/index" });
      }, 1500);
      return;
    }

    this.setData({ publishing: true });
    wx.showLoading({ title: "发布中…", mask: true });
    wx.request({
      url: `${baseUrl}/api/messages`,
      method: "POST",
      header: getAuthHeaders(true),
      data: { content: text },
      success: (res) => {
        wx.hideLoading();
        const body = res.data || {};
        if (res.statusCode !== 200 || body.code !== 200) {
          wx.showToast({ title: body.message || "发布失败", icon: "none" });
          return;
        }
        wx.showToast({ title: "发布成功", icon: "success" });
        this.setData({ declarationText: "" });
        this.loadDeclarations();
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: "网络错误，请重试", icon: "none" });
      },
      complete: () => {
        this.setData({ publishing: false });
      },
    });
  },

  loadDeclarations() {
    const { baseUrl } = this.data;
    this.setData({ wallLoading: true });
    wx.request({
      url: `${baseUrl}/api/messages`,
      method: "GET",
      header: getAuthHeaders(false),
      success: (res) => {
        const body = res.data || {};
        if (res.statusCode !== 200 || body.code !== 200) {
          wx.showToast({ title: body.message || "加载失败", icon: "none" });
          return;
        }
        const declarations = mapDeclarations(body.data);
        const count = declarations.length;
        const scrollLists = buildScrollLists(declarations);
        this.setData({
          declarations,
          scrollPrimary: scrollLists.primary,
          scrollSecondary: scrollLists.secondary,
          wallEmpty: count === 0,
          wallScrollEnabled: count > 1,
          scrollDuration: calcScrollDuration(count),
        });
      },
      fail: () => {
        wx.showToast({ title: "网络错误", icon: "none" });
      },
      complete: () => {
        this.setData({ wallLoading: false });
      },
    });
  },
});
