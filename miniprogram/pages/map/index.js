const config = require('../../config');

/** 设计稿 402 宽 → rpx（750 基准） */
const S = 750 / 402;

/** 卡片宽 150 设计 px；加高便于缩略图 aspectFit 完整露出 */
const CARD_W = 150 * S;
const CARD_H = (150 + 42) * S;

Page({
  data: {
    baseUrl: config.baseUrl,

    /**
     * 手绘地图稿 GTd0dnRsWjR6WycqT789NG node 1:2
     * thumb：Figma 矩形节点 1:152 陈列馆、1:151 红军路、1:153 党史馆、1:155 纪念碑、1:154 红军村
     * 已用 Framelink MCP 导出至 server/img/map-shouxie-thumb-*.png
     * 单框卡片：宽 150 设计 px，高度略加（CARD_H）便于缩略图完整展示
     */
    stations: [
      {
        id: 1,
        num: '第1站',
        name: '陈列馆',
        title: '星火初燃',
        status: '可打卡',
        thumb: 'map-shouxie-thumb-1-chenlie.png',
        thumbShift: true,
        left: 233 * S,
        top: 118 * S,
        w: CARD_W,
        h: CARD_H
      },
      {
        id: 2,
        num: '第2站',
        name: '红军路',
        title: '薪火相传',
        status: '可打卡',
        thumb: 'map-shouxie-thumb-2-hongjunlu.png',
        left: 25 * S,
        top: 229 * S,
        w: CARD_W,
        h: CARD_H
      },
      {
        id: 3,
        num: '第3站',
        name: '党史馆',
        title: '淬火成钢',
        status: '可打卡',
        thumb: 'map-shouxie-thumb-3-dangshiguan.png',
        left: 233 * S,
        top: 372 * S,
        w: CARD_W,
        h: CARD_H
      },
      {
        id: 4,
        num: '第4站',
        name: '纪念碑',
        title: '丰碑永铸',
        status: '可打卡',
        thumb: 'map-shouxie-thumb-4-jinianbei.png',
        left: 25 * S,
        top: 500 * S,
        w: CARD_W,
        h: CARD_H
      },
      {
        id: 5,
        num: '第5站',
        name: '红军村',
        title: '薪火延续',
        status: '进行中',
        thumb: 'map-shouxie-thumb-5-hongjuncun.png',
        thumbShift: true,
        left: 233 * S,
        top: 655 * S,
        w: CARD_W,
        h: CARD_H
      }
    ],

    canvasHeightRpx: (874 + 48) * S
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onBackHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onEnterStation(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/stations/${id}/index?id=${id}`
    });
  }
});
