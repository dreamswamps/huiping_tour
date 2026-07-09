// 灰坪乡边界
const BOUNDS = {
  minLat: 29.20,
  maxLat: 29.28,
  minLng: 118.80,
  maxLng: 118.90,
};

// 默认 17 级，可缩小到 13 级
const MIN_SCALE = 13;
const DEFAULT_SCALE = 17;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 5 个传薪站点
const STATIONS = [
  { id: 1, num: "第1站", name: "陈列馆", title: "星火初燃", latitude: 29.258957, longitude: 118.810398 },
  { id: 2, num: "第2站", name: "红军路", title: "薪火相传", latitude: 29.252, longitude: 118.845 },
  { id: 3, num: "第3站", name: "党史馆", title: "淬火成钢", latitude: 29.240, longitude: 118.860 },
  { id: 4, num: "第4站", name: "纪念碑", title: "丰碑永铸", latitude: 29.232, longitude: 118.848 },
  { id: 5, num: "第5站", name: "红军村", title: "薪火延续", latitude: 29.244, longitude: 118.870 },
];

// 10 个景点点位（坐标暂估算，后续替换）
const SPOTS = [
  { id: 101, name: "上坪田村红军墓",      latitude: 29.258, longitude: 118.813 },
  { id: 102, name: "红军秘密联络处旧址",    latitude: 29.257, longitude: 118.811 },
  { id: 103, name: "老红军故居",           latitude: 29.259, longitude: 118.812 },
  { id: 104, name: "朱法祠",              latitude: 29.256, longitude: 118.814 },
  { id: 105, name: "千年古树群",           latitude: 29.253, longitude: 118.812 },
  { id: 106, name: "上坪田乡愁文化长廊",    latitude: 29.257, longitude: 118.810 },
  { id: 107, name: "红色千里岗景区",        latitude: 29.242, longitude: 118.850 },
  { id: 108, name: "云上千里民宿（西坞村）", latitude: 29.238, longitude: 118.860 },
  { id: 109, name: "华东第一天坑景区",      latitude: 29.232, longitude: 118.865 },
  { id: 110, name: "金鸡洞",              latitude: 29.248, longitude: 118.868 },
];

function buildStationMarkers() {
  return STATIONS.map((s) => ({
    id: s.id,
    latitude: s.latitude,
    longitude: s.longitude,
    title: s.name,
    callout: {
      content: s.num + " " + s.name + "\n" + s.title,
      color: "#c91f37",
      fontSize: 13,
      borderRadius: 8,
      padding: 8,
      display: "ALWAYS",
    },
    width: 36,
    height: 36,
  }));
}

function buildSpotMarkers() {
  return SPOTS.map((s) => ({
    id: s.id,
    latitude: s.latitude,
    longitude: s.longitude,
    title: s.name,
    callout: {
      content: s.name,
      color: "#5c3a21",
      fontSize: 12,
      borderRadius: 8,
      padding: 6,
      display: "ALWAYS",
    },
    width: 28,
    height: 28,
  }));
}

Page({
  data: {
    centerLat: 29.258957,
    centerLng: 118.810398,
    markers: [...buildStationMarkers(), ...buildSpotMarkers()],
    scale: DEFAULT_SCALE,
    rotate: 90,
    polylines: [{
      points: STATIONS.map((s) => ({ latitude: s.latitude, longitude: s.longitude })),
      color: "#c91f37",
      width: 4,
      borderColor: "#fff",
      borderWidth: 2,
      arrowLine: true,
    }],
  },

  onReady() {
    this.mapCtx = wx.createMapContext("satelliteMap", this);
  },

  onRegionChange(e) {
    if (e.type !== "end") return;

    if (e.causedBy === "drag") {
      const center = e.detail.centerLocation;
      if (center) {
        const clampedLat = clamp(center.latitude, BOUNDS.minLat, BOUNDS.maxLat);
        const clampedLng = clamp(center.longitude, BOUNDS.minLng, BOUNDS.maxLng);
        if (clampedLat !== center.latitude || clampedLng !== center.longitude) {
          this.setData({
            centerLat: clampedLat,
            centerLng: clampedLng,
          });
        }
      }
    }

    if (e.causedBy === "scale" || e.causedBy === "drag") {
      this.mapCtx.getScale({
        success: (res) => {
          if (res.scale < MIN_SCALE) {
            this.setData({ scale: MIN_SCALE });
          }
        },
      });
    }
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId;
    if (markerId <= 100) {
      wx.navigateTo({
        url: `/package-other/stations/${markerId}/index?id=${markerId}`,
      });
    } else {
      const spot = SPOTS.find((s) => s.id === markerId);
      if (spot) {
        wx.navigateTo({
          url: "/package-guide/spot-detail/index?name=" + encodeURIComponent(spot.name),
        });
      }
    }
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },
});
