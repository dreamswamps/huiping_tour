Component({
  data: {
      config: {},
      showOverlay: true,
      showLoading: false,
      showLoadingText: "",
      width: 320,
      height: 500,
      dpi: 1,
      runingCrs: false,
      tracking: false,
  },
  lifetimes: {
      attached() {
          const sys = wx.getSystemInfoSync();
          this.setData({
              width: sys.windowWidth,
              height: sys.windowHeight,
              dpi: sys.pixelRatio,
              config: getApp().globalData.config,
          });
      },
  },

  methods: {
      showLoading(text) {
          this.setData({
              showLoading: true,
              showLoadingText: text,
          });
      },
      hideLoading() {
          this.setData({
              showLoading: false,
          });
      },
      back() {
          this.stop();
          this.setData({
              showOverlay: true,
              tracking: false,
          });
      },
      download() {
          wx.saveImageToPhotosAlbum({
              filePath: "../images/xiongmao.png",
              success: res => wx.showToast({ title: "已保存到相册", icon: "none" }),
              fail: res => wx.showToast({ title: "保存失败", icon: "none" }),
          });
      },
      scan() {
          this.setData({
              showOverlay: false,
              runingCrs: true,
              tracking: true,
          });
          this.showLoading("识别中");
      },
      stop() {
          this.setData({ runingCrs: false });
          this.hideLoading();
      },
      onSearchSuccess(res) {
          // 识别到目标的回调
          console.info(res);
          this.stop();
      },
  },
})