const KEY = 'mall_cart';

const DISPLAY_ORDER = ['huozhong', 'xinghuo', 'liaoyuan'];

function load() {
  try {
    const raw = wx.getStorageSync(KEY);
    return Array.isArray(raw) ? raw : [];
  } catch (e) {
    return [];
  }
}

function save(list) {
  wx.setStorageSync(KEY, list);
}

function sortByDisplayOrder(list) {
  return [...list].sort(
    (a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id)
  );
}

function addOrIncrement(product) {
  const list = load();
  const idx = list.findIndex((i) => i.id === product.id);
  if (idx >= 0) {
    list[idx].quantity = (list[idx].quantity || 1) + 1;
  } else {
    list.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      thumb: product.thumb,
      spec: product.spec || '250g',
      quantity: 1,
      selected: true
    });
  }
  save(list);
}

module.exports = {
  KEY,
  load,
  save,
  sortByDisplayOrder,
  addOrIncrement
};
