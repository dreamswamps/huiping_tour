const config = require("../../config");

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    playingId: "",
    trackTimes: { 1: "0:00", 2: "0:00", 3: "0:00", 4: "0:00" },
    trackDurations: { 1: "0:00", 2: "0:00", 3: "0:00", 4: "0:00" },
    tracks: [
      { id: "1", name: "陈列馆", desc: "红色千里岗革命历史陈列馆" },
      { id: "2", name: "红军路", desc: "蛤蟆岭红军路" },
      { id: "3", name: "党史馆", desc: "千里岗红色革命党史馆" },
      { id: "4", name: "纪念碑", desc: "中共衢遂寿中心县委第二区委旧址纪念碑" },
    ],
  },

  formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" + sec : sec);
  },

  onLoad() {
    this.innerAudioContext = wx.createInnerAudioContext();

    const tracks = this.data.tracks.map((t) => ({
      ...t,
      imgUrl:
        config.svgsUrl +
        "/station" +
        t.id +
        (t.id === "2" || t.id === "4" ? ".jpg" : ".png"),
    }));
    this.setData({ tracks });

    // Probe each audio independently to get actual durations
    const ids = ["1", "2", "3", "4"];
    let idx = 0;
    const probeNext = () => {
      if (idx >= ids.length) return;
      const id = ids[idx];
      const temp = wx.createInnerAudioContext();
      temp.src = config.svgsUrl + "/media/" + id + ".MP3";
      let resolved = false;
      temp.onCanplay(() => {
        if (!resolved) {
          resolved = true;
          const dur = temp.duration;
          if (dur && dur > 0) {
            this.data.trackDurations[id] = this.formatTime(dur);
            this.setData({ trackDurations: this.data.trackDurations });
          }
          temp.destroy();
          idx++;
          probeNext();
        }
      });
      temp.onError(() => {
        if (!resolved) {
          resolved = true;
          temp.destroy();
          idx++;
          probeNext();
        }
      });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          temp.destroy();
          idx++;
          probeNext();
        }
      }, 5000);
    };
    probeNext();

    this.innerAudioContext.onEnded(() => {
      const id = this.data.playingId;
      if (id) {
        this.data.trackTimes[id] = this.data.trackDurations[id] || "0:00";
        this.setData({ trackTimes: this.data.trackTimes, playingId: "" });
      }
    });
    this.innerAudioContext.onTimeUpdate(() => {
      const id = this.data.playingId;
      if (id) {
        const remaining = Math.max(
          0,
          this.innerAudioContext.duration - this.innerAudioContext.currentTime,
        );
        this.data.trackTimes[id] = this.formatTime(remaining);
        this.setData({ trackTimes: this.data.trackTimes });
      }
    });
  },

  onUnload() {
    if (this.innerAudioContext) {
      this.innerAudioContext.destroy();
    }
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onPlayTap(e) {
    const id = e.currentTarget.dataset.id;
    const { playingId } = this.data;
    if (playingId === id) {
      this.innerAudioContext.pause();
      this.setData({ playingId: "" });
      return;
    }
    const src = config.svgsUrl + "/media/" + id + ".MP3";
    this.innerAudioContext.src = src;
    this.innerAudioContext.play();
    this.data.trackTimes[id] = "0:00";
    this.setData({ playingId: id, trackTimes: this.data.trackTimes });
  },
});
