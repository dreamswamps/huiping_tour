// 灰坪乡边界
const BOUNDS = {
  minLat: 29.20,
  maxLat: 29.28,
  minLng: 118.80,
  maxLng: 118.90,
};

// 14 级是最大视野，不能缩得更小
const MIN_SCALE = 14;

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 站点数据
const STATIONS = [
  { id: 1, num: "第1站", name: "陈列馆", title: "星火初燃", latitude: 29.258957, longitude: 118.810398 },
];

Page({
  data: {
    centerLat: 29.24099,
    centerLng: 118.85542,
    markers: STATIONS.map((s) => ({
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
    })),
    scale: MIN_SCALE,
  },

  onReady() {
    this.mapCtx = wx.createMapContext("satelliteMap", this);
  },

  onRegionChange(e) {
    if (e.type !== "end") return;

    // 拖拽结束 — 限制中心点不超出灰坪乡
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

    // 缩放结束 — 限制不小于 14 级
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
    wx.navigateTo({
      url: `/package-other/stations/${markerId}/index?id=${markerId}`,
    });
  },

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },
});
