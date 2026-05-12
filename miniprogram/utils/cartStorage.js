const KEY = 'mall_cart';

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
  return [...list];
}

function addOrIncrement(product) {
  const list = load();
  const idx = list.findIndex((i) => String(i.id) === String(product.id));
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

/** 按商品 id 从本地购物车移除（下单成功后同步） */
function removeByProductIds(productIds) {
  const set = new Set((productIds || []).map((x) => String(x)));
  if (set.size === 0) return;
  const list = load().filter((i) => !set.has(String(i.id)));
  save(list);
}

module.exports = {
  KEY,
  load,
  save,
  sortByDisplayOrder,
  addOrIncrement,
  removeByProductIds,
};
