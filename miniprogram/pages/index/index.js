const config = require("../../config");

Page({
  data: {
    baseUrl: config.baseUrl,
    svgsUrl: config.svgsUrl,
    swiperCurrent: 0,
    bannerList: [
      {
        //图床是从 1开始标号的。。。。
        id: "b0",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/B1.jpg",
      },
      {
        id: "b1",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/B2.jpg",
      },
      {
        id: "b2",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/B3.png",
      },
      {
        id: "b3",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/B4.png",
      },
      {
        id: "b4",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/B5.png",
      },
    ],
    // spots: [
    //   { title: '两头洞', desc: '华东自然岩壁第一洞' , img: 'homepage1.png' },
    //   { title: '白塔洞', desc: '位于灰坪乡杜家田村以西，洞崖滴水，常年不绝', img: 'homepage2.png' },
    //   { title: '中共衢遂寿中心县委第二区委旧址', desc: '光荣革命传统的圣地', img: 'homepage3.png' }
    // ]
    spots: [
      {
        title: "两头洞",
        desc: "华东自然岩壁第一洞",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/S1.png",
      },
      {
        title: "白塔洞",
        desc: "位于灰坪乡杜家田村以西，洞崖滴水，常年不绝",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/S2.png",
      },
      {
        title: "中共衢遂寿中心县委第二区委旧址",
        desc: "光荣革命传统的圣地",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/S3.png",
      },
      {
        title: "上坪田村红军墓",
        desc: "紧邻红色千里岗革命烈士纪念碑，形成「一碑多墓」红色祭扫组团，现存完整红军烈士墓葬5座",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/sptchjm.JPG",
      },
      {
        title: "老红军故居",
        desc: "村内保留多处红军指战员长期居住的夯土老民居，完整复原游击时期红军生活原貌",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/lhjgj.JPG",
      },
      {
        title: "朱法祠",
        desc: "上坪田村百年古宗族祠堂，革命年代成为红军游击队临时集会议事点及后勤落脚点",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/zfc.JPG",
      },
      {
        title: "千年古树群",
        desc: "上坪田村后山连片千年原生古木林，曾是红军游击队天然的隐蔽屏障",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/qngsq.png",
      },
      {
        title: "云上千里民宿（西坞村）",
        desc: "坐落于灰坪乡西坞深山村落，四面环绕千里岗连绵青山，视野开阔、空气清新",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/ysqlms.JPG",
      },
      {
        title: "华东第一天坑景区",
        desc: "灰坪乡标志性大型喀斯特巨型天坑地质景观，亿万年地质运动造就巨型坑体",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/hddytkjq.png",
      },
      {
        title: "金鸡洞",
        desc: "与两头洞紧密相邻，主洞全长近千米，洞内完整保留200万年原始岩溶地貌",
        img: "https://svgs1.oss-cn-beijing.aliyuncs.com/jjd.png",
      },
    ],
  },

  onLoad() {},

  onShow() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onSwiperChange(e) {
    this.setData({
      swiperCurrent: e.detail.current,
    });
  },

  onPrevSlide() {
    const n = this.data.bannerList.length;
    let current = this.data.swiperCurrent;
    current = current === 0 ? n - 1 : current - 1;
    this.setData({ swiperCurrent: current });
  },

  onNextSlide() {
    const n = this.data.bannerList.length;
    let current = this.data.swiperCurrent;
    current = current === n - 1 ? 0 : current + 1;
    this.setData({ swiperCurrent: current });
  },

  onScanTap() {
    wx.showToast({ title: "AR功能需授权后使用", icon: "none" });
  },

  onFuncCard(e) {
    // const type = e.currentTarget.dataset.type;
    // if (type === 'badge') {
    //   wx.showToast({ title: '我的徽章', icon: 'none' });
    //   return;
    // }
    // wx.showToast({ title: '敬请期待', icon: 'none' });
    wx.navigateTo({ url: "/package-profile/badges/index" });
  },

  goToSubmodule(e) {
    const { url } = e.currentTarget.dataset;
    if (!url) return;
    wx.navigateTo({ url });
  },

  onVoiceGuide() {
    wx.navigateTo({ url: "/package-guide/voice-guide/index" });
  },

  onSpotDetail(e) {
    const title = e.currentTarget.dataset.title || "";
    if (title === "两头洞") {
      wx.navigateTo({ url: "/package-guide/liangtoudong/index" });
      return;
    }
    if (title === "白塔洞") {
      wx.navigateTo({ url: "/package-guide/baitadong/index" });
      return;
    }
    if (title === "中共衢遂寿中心县委第二区委旧址") {
      wx.navigateTo({ url: "/package-guide/dierquweijiuzhi/index" });
      return;
    }
    // 其余景点走通用详情页
    wx.navigateTo({
      url: "/package-guide/spot-detail/index?name=" + encodeURIComponent(title),
    });
  },

  goMap() {
    wx.switchTab({ url: "/pages/map/index" });
  },
});
