const config = require("../../config");

const badgeList = [
  {
    id: 1,
    img: "map-shouxie-thumb-1-chenlie.png",
    station: "STATION 01",
    title: "星火初燃",
    name: "陈列馆",
    desc: "点亮初心火种",
    obtained: true,
  },
  {
    id: 2,
    img: "map-shouxie-thumb-2-hongjunlu.png",
    station: "STATION 02",
    title: "薪火相传",
    name: "红军路",
    desc: "解锁历史故事",
    obtained: true,
  },
  {
    id: 3,
    img: "map-shouxie-thumb-3-dangshiguan.png",
    station: "STATION 03",
    title: "淬火成钢",
    name: "党史馆",
    desc: "签署守护承诺",
    obtained: false,
  },
  {
    id: 4,
    img: "map-shouxie-thumb-4-jinianbei.png",
    station: "STATION 04",
    title: "丰碑永铸",
    name: "纪念碑",
    desc: "献花致敬英雄",
    obtained: false,
  },
  {
    id: 5,
    img: "map-shouxie-thumb-5-hongjuncun.png",
    station: "STATION 05",
    title: "薪火延续",
    name: "红军村",
    desc: "发布传薪宣言",
    obtained: false,
  },
];

Page({
  data: {
    svgsUrl: config.svgsUrl,
    badges: [],
  },

  onLoad() {
    const badges = badgeList.map((b) => ({
      ...b,
      imgUrl: config.svgsUrl + "/" + b.img,
    }));
    this.setData({ badges });
  },

  onBack() {
    wx.navigateBack();
  },
});
