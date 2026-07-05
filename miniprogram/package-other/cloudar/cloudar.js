// kivicube 插件需要在 app.json plugins 中配置，并在微信公众平台添加插件
// 当前插件未配置，AR 功能暂不可用
// 如需启用：1) 微信公众平台添加 kivicube 插件 2) app.json plugins 中声明

Page({
  onLoad() {
    wx.showModal({
      title: "AR扫描",
      content: "AR 功能需要配置 kivicube 插件后才能使用",
      showCancel: false,
    });
  },
  ready({ detail: { sceneInfo } }) {
    console.log("当前场景基础信息", sceneInfo);
    wx.showToast({ title: "场景加载中...", icon: "none" });
  },
  downloadStart() {},
  downloadProgress() {},
  downloadEnd() {},
  loadStart() {},
  loadEnd() {},
  sceneStart() {
    wx.showToast({ title: "可开始体验场景", icon: "none" });
  },
  openUrl({ detail: url }) {
    wx.navigateTo({ url: `path/to/webview?url=${encodeURIComponent(url)}` });
  },
  photo({ detail: photoPath }) {
    wx.saveImageToPhotosAlbum({
      filePath: photoPath,
      success() {
        console.log("保存照片成功");
      },
      fail(e) {
        console.error("保存照片失败", e);
      },
    });
  },
  error(e) {
    const { detail } = e;
    if (detail && detail.isCameraAuthDenied) {
      // 如果是权限问题，则向用户申请权限。
      const page = this;
      wx.showModal({
        title: "提示",
        content: "请给予“摄像头”权限",
        success() {
          wx.openSetting({
            success({ authSetting: { "scope.camera": isGrantedCamera } }) {
              if (isGrantedCamera) {
                clearSceneCache();
                wx.redirectTo({ url: "/" + page.__route__ });
              } else {
                wx.showToast({ title: "获取“摄像头”权限失败！", icon: "none" });
              }
            },
          });
        },
      });
    }
    console.error(e);
  },
});
