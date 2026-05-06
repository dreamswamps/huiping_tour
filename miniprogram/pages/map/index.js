const config = require('../../config');

Page({
  data: {
    baseUrl: config.baseUrl,

    // 站点数据（按设计稿 5 站，先右后左）
    stations: [
      {
        id: 1, num: '第1站', name: '陈列馆',
        title: '星火初燃', desc: '打响革命第一枪',
        status: '进行中', position: 'right'
      },
      {
        id: 2, num: '第2站', name: '红军路',
        title: '薪火相传', desc: '感受革命精神',
        status: '可打卡', position: 'left'
      },
      {
        id: 3, num: '第3站', name: '党史馆',
        title: '淬火成钢', desc: '百年党史，铭记奋斗历程',
        status: '可打卡', position: 'right'
      },
      {
        id: 4, num: '第4站', name: '纪念碑',
        title: '丰碑永铸', desc: '英雄长眠，精神永垂不朽',
        status: '可打卡', position: 'left'
      },
      {
        id: 5, num: '第5站', name: '红军村',
        title: '新火续燃', desc: '传承精神，续写时代新篇',
        status: '可打卡', position: 'right'
      }
    ],

    // 连接线 SVG（按 Z 字形方向：左→右 用 / 形，右→左 用 \ 形）
    lines: ['figma-line-lr-a.svg', 'figma-line-rl-a.svg', 'figma-line-lr-b.svg', 'figma-line-rl-b.svg']
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  // 进入站点详情
  onEnterStation(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/stations/${id}/index?id=${id}`
    });
  }
});
