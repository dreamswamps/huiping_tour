const SPOT_DATA = {
  "上坪田村红军墓": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/sptchjm.JPG",
    body: "紧邻红色千里岗革命烈士纪念碑，形成「一碑多墓」红色祭扫组团，现存完整红军烈士墓葬5座，长眠着当年在千里岗山区游击作战中负伤牺牲、就地安葬的红军游击队员。每一座烈士墓碑顶端都雕刻鲜红五角星，是独属于灰坪本地的红色标识。"
  },
  "老红军故居": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/lhjgj.JPG",
    body: "村内保留多处当年红军指战员长期居住的夯土老民居，完整复原游击时期红军生活原貌。屋内留存红军当年使用过的土灶、木板床、草鞋、旧农具、简易作战背包复刻展品，墙面保留红军标语痕迹，真实还原缺衣少食、靠山宿营的艰苦游击日常。"
  },
  "朱法祠": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/zfc.JPG",
    body: "上坪田村百年古宗族祠堂，古建筑木梁、雕花门窗保存完好，是本地人文古迹与红色历史融合的特色点位。革命年代，祠堂空间开阔、位置隐蔽，成为红军游击队临时集会议事点，同时承担后勤落脚、伤员临时休养、物资集中存放的功能。"
  },
  "千年古树群": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/qngsq.png",
    body: "上坪田村后山连片分布成片千年原生古木林，多株古树树龄超千年，枝繁叶茂、山林幽深。这片古树群不只是优质自然生态景观，更是当年红军游击队天然的隐蔽屏障。茂密古树遮挡视线、山林小道四通八达，红军战士曾依靠古树掩护躲避敌军搜山，林间树洞、林下空地曾用来藏匿枪支、存放粮食。"
  },
  "云上千里民宿（西坞村）": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/ysqlms.JPG",
    body: "坐落于灰坪乡西坞深山村落，四面环绕千里岗连绵青山，视野开阔、空气清新，因此得名「云上千里」。"
  },
  "华东第一天坑景区": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/hddytkjq.png",
    body: "灰坪乡标志性大型喀斯特巨型天坑地质景观，亿万年地质运动造就巨型坑体，四周绝壁陡峭高耸，坑底植被幽深茂密，地质特征极具科普价值。景区开发观光步道、地质科普解说牌，同时配套岩壁速降、峡谷徒步、坑底探秘等户外实践项目。"
  },
  "金鸡洞": {
    img: "https://svgs1.oss-cn-beijing.aliyuncs.com/jjd.png",
    body: "与两头洞紧密相邻，互通形成溶洞研学组团，主洞全长近千米，洞内恒温常年维持18℃，四季清凉舒适。洞内完整保留200万年原始岩溶地貌，遍布形态各异的钟乳石、石笋、石花，地下暗河蜿蜒穿梭，景观奇特壮观。"
  },
};

Page({
  data: {
    name: "",
    img: "",
    body: "",
  },

  onLoad(options) {
    const name = decodeURIComponent(options.name || "");
    const spot = SPOT_DATA[name];
    if (spot) {
      this.setData({ name, img: spot.img, body: spot.body });
    }
  },

  onBack() {
    wx.navigateBack();
  },
});
