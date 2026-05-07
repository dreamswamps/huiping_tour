const config = require('../../config.js');
const cartStorage = require('../../utils/cartStorage.js');

const PROMPT_ICON = {
  huozhong: 'mall-prompt-huozhong.svg',
  xinghuo: 'mall-prompt-xinghuo.svg',
  liaoyuan: 'mall-prompt-liaoyuan.svg'
};

Page({
  data: {
    baseUrl: config.baseUrl,
    products: [
      {
        id: 'huozhong',
        name: '传薪·火种',
        desc: '特级明前高山岩茶，象征革命最初星火，每一泡皆是先辈精神的淬炼与传承',
        price: '268',
        thumb: 'mall-product-thumb-1.png'
      },
      {
        id: 'xinghuo',
        name: '传薪·星火',
        desc: '一级雨前高山茶，寓意革命力量发展壮大，千里岗山场精选，香气馥郁',
        price: '128',
        thumb: 'mall-product-thumb-2.png'
      },
      {
        id: 'liaoyuan',
        name: '传薪·燎原',
        desc: '多品类茶品组合，含传薪茶、灰坪苦丁茶、黄金茶，寓意红色精神遍地开花',
        price: '388',
        thumb: 'mall-product-thumb-3.png'
      }
    ]
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onProductCardTap(e) {
    const id = e.currentTarget.dataset.id;
    const routes = {
      huozhong: '/pages/mall/huozhong/index',
      xinghuo: '/pages/mall/xinghuo/index',
      liaoyuan: '/pages/mall/liaoyuan/index'
    };
    const url = routes[id];
    if (!url) return;
    wx.navigateTo({ url });
  },

  showMallTip(opts) {
    const comp = this.selectComponent('#mallFigmaTip');
    if (comp) comp.show(opts);
  },

  onAddCart(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.products.find((p) => p.id === id);
    if (!item) return;
    cartStorage.addOrIncrement({
      id: item.id,
      name: item.name,
      price: item.price,
      thumb: item.thumb,
      spec: '250g'
    });
    const iconFile = PROMPT_ICON[item.id];
    this.showMallTip({
      message: `${item.name} 已加入购物车`,
      icon: iconFile ? `${this.data.baseUrl}/img/${iconFile}` : '',
      duration: 2000
    });
  },

  onBuyNow(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.products.find((p) => p.id === id);
    if (!item) return;
    cartStorage.addOrIncrement({
      id: item.id,
      name: item.name,
      price: item.price,
      thumb: item.thumb,
      spec: '250g'
    });
    this.showMallTip({
      message: '正在跳转结算页面……',
      icon: `${this.data.baseUrl}/img/mall-prompt-settle.svg`,
      duration: 1600,
      onEnd: () => {
        wx.navigateTo({ url: '/pages/mall/cart/index' });
      }
    });
  },

  onFabCart() {
    wx.navigateTo({ url: '/pages/mall/cart/index' });
  }
});
