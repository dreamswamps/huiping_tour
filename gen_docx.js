const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  TabStopType,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");

const doc = new Document({
  title: "红旅薪传 手机远程测试指南",
  styles: {
    paragraphStyles: [
      { id: "Normal", name: "Normal", run: { size: 22, font: "微软雅黑" } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
        },
      },
      children: [
        // ── 标题 ──
        new Paragraph({
          text: "红旅薪传 手机远程测试指南",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),

        // ═══════ 一 ═══════
        h1("一、测试方需要做的"),
        h2("1.1 加为体验成员（必须先做）"),
        p("开发者需要在微信公众平台添加测试者："),
        numbered([
          "打开 mp.weixin.qq.com → 登录",
          "左侧菜单：管理 → 成员管理",
          "体验成员 → 添加 → 输入测试者的微信号",
          "测试者微信会收到邀请，点击同意",
        ]),
        callout("没加体验成员之前，扫码会提示「暂无权限」，无法进入小程序。"),

        h2("1.2 测试者拿到二维码"),
        p(
          "开发者打开微信开发者工具 → 点击顶部工具栏「预览」→ 生成二维码 → 发给测试者。",
        ),
        callout(
          "每次改完代码都需要重新点「预览」生成新二维码，旧码不会自动更新。",
        ),

        // ═══════ 二 ═══════
        h1("二、测试者扫码后的操作"),
        h2("2.1 扫码进入"),
        p("微信扫二维码 → 小程序打开。"),
        h2("2.2 开启调试模式（强烈建议）"),
        numbered([
          "进入小程序后，点微信右上角「…」",
          "选择「打开调试」",
          "小程序会重新启动",
        ]),
        callout(
          "开启调试后，页面底部会出现一个绿色调试按钮。如果遇到白屏、报错，点它可以看日志。",
        ),
        h2("2.3 页面加载说明"),
        bullet([
          "首次打开较慢（3~8 秒）是正常的，因为要加载 OSS 上的图片和字体资源",
          "再次打开会快很多（有缓存）",
          "商城页需要从云服务器加载商品数据，点进去等一下即可",
        ]),

        // ═══════ 三 ═══════
        h1("三、测试内容"),

        h2("3.1 传薪地图 ⭐ 本次重点"),
        p("入口：底部 Tab 栏 → 第二个图标「地图」"),
        table(
          ["#", "检查项", "怎么测", "☐"],
          [
            ["1", "页面能打开", "点击地图 Tab，不白屏不闪退", ""],
            ["2", "顶部标题", "看到红色大字「传薪地图」", ""],
            [
              "3",
              "火焰标语",
              "白底框内显示「🔥 重走传薪路 · 点亮五站火种」",
              "",
            ],
            ["4", "返回按钮", "左上角红色「返回首页」，点击回到首页", ""],
            ["5", "轮播图", "标题和站点卡片之间有方框图片区域", ""],
            ["6", "两张图切换", "等 6 秒自动切换到下一张", ""],
            ["7", "指示圆点", "图片下方有两个点，红色的是当前", ""],
            ["8", "循环播放", "第二张播完回到第一张（等 12 秒验证）", ""],
            ["9", "手指滑动", "左滑/右滑能切图，不卡", ""],
            ["10", "第1站卡片", "「第1站 陈列馆·星火初燃」右上角位置", ""],
            ["11", "第2站卡片", "「第2站 红军路·薪火相传」左下位置", ""],
            ["12", "第3站卡片", "「第3站 党史馆·淬火成钢」可打卡", ""],
            ["13", "第4站卡片", "「第4站 纪念碑·丰碑永铸」可打卡", ""],
            ["14", "第5站卡片", "「第5站 红军村·薪火延续」进行中", ""],
            ["15", "卡片外观", "白色底、深红边框、圆角，图在上文在下", ""],
            ["16", "进入站点", "点卡片上的「进入站点」，跳转详情页", ""],
            ["17", "上下滚动", "向下滑看到全部 5 站，流畅", ""],
          ],
        ),

        h2("3.2 商城页"),
        p("入口：底部 Tab 栏 → 第三个图标「商城」"),
        table(
          ["#", "检查项", "怎么测", "☐"],
          [
            ["1", "页面加载", "打开不报错", ""],
            ["2", "商品列表", "能看到商品卡片", ""],
            ["3", "图片正常", "商品图片不裂不白", ""],
            ["4", "价格显示", "每个商品有价格", ""],
          ],
        ),
        callout(
          "如果显示「网络异常，请检查后端服务」→ 告知开发者检查云服务器。",
        ),

        h2("3.3 首页"),
        p("入口：底部 Tab 栏 → 第一个图标「首页」"),
        table(
          ["#", "检查项", "☐"],
          [
            ["1", "Banner 图正常显示", ""],
            ["2", "功能卡片（地图/AR/徽章）可点", ""],
            ["3", "底部四个 Tab 切换正常", ""],
          ],
        ),

        h2("3.4 个人中心"),
        p("入口：底部 Tab 栏 → 第四个图标「我的」"),
        table(
          ["#", "检查项", "☐"],
          [
            ["1", "页面正常显示", ""],
            ["2", "点击头像弹出登录", ""],
          ],
        ),

        // ═══════ 四 ═══════
        h1("四、常见问题"),

        problem(
          "扫码进不去",
          "没加体验成员。去微信公众平台 → 成员管理 → 体验成员 → 添加微信号。",
        ),
        problem(
          "页面白屏/空白",
          "1. 微信右上角「…」→ 重新进入小程序\n2. 开启调试模式，看绿底是否有红色报错\n3. 截图发给开发者",
        ),
        problem(
          "商城显示「网络异常」",
          "云服务器后端可能挂了，告知开发者重启。",
        ),
        problem(
          "图片加载很慢或裂了",
          "首次加载慢正常（3~8秒）。如果一直裂图 → 检查手机网络是否正常。",
        ),
        problem(
          "轮播图不动",
          "1. 真机上自动轮播是正常的，开发者工具里可能暂停\n2. 如果等了 10 秒以上还不换 → 截图反馈",
        ),

        // ═══════ 五 ═══════
        h1("五、反馈时请附上"),
        table(
          ["信息", "示例"],
          [
            ["手机型号", "iPhone 14 Pro / 小米 13"],
            ["微信版本", "8.0.xx"],
            ["网络", "WiFi / 5G"],
            ["问题页面", "传薪地图 / 商城"],
            ["问题描述", "具体哪个位置、什么现象"],
            ["截图", "截全屏，别裁切"],
          ],
          true,
        ),

        // ═══════ 六 ═══════
        h1("六、技术信息（给开发者看）"),
        table(
          ["项目", "值"],
          [
            ["后端地址", "http://110.40.187.34:3000"],
            ["数据库", "MySQL 110.40.187.34:3306，库名 hpt"],
            ["OSS", "svgs1.oss-cn-beijing.aliyuncs.com"],
            ["代码仓库", "https://gitee.com/redteaball/huiping_tour"],
            ["分支", "616dome"],
            ["AppID", "wx3f0567dc86f7ca12"],
            ["当前 baseUrl", "http://110.40.187.34:3000"],
          ],
          true,
        ),
      ],
    },
  ],
});

// ── 辅助函数 ──
function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    run: { font: "微软雅黑", size: 32, bold: true, color: "c91f37" },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    run: { font: "微软雅黑", size: 26, bold: true },
  });
}

function p(text) {
  return new Paragraph({
    text,
    spacing: { after: 100 },
    run: { font: "微软雅黑", size: 21 },
  });
}

function bullet(items) {
  return items.map(
    (t) =>
      new Paragraph({
        text: t,
        bullet: { level: 0 },
        spacing: { after: 60 },
        run: { font: "微软雅黑", size: 21 },
      }),
  );
}

function numbered(items) {
  return items.map(
    (t, i) =>
      new Paragraph({
        children: [
          new TextRun({
            text: `${i + 1}. `,
            font: "微软雅黑",
            size: 21,
            bold: true,
          }),
          new TextRun({ text: t, font: "微软雅黑", size: 21 }),
        ],
        spacing: { after: 60 },
      }),
  );
}

function callout(text) {
  return new Paragraph({
    text: `⚠ ${text}`,
    spacing: { before: 80, after: 120 },
    indent: { left: 200 },
    run: { font: "微软雅黑", size: 20, italics: true, color: "c91f37" },
  });
}

function problem(title, desc) {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `▸ ${title}`,
          font: "微软雅黑",
          size: 21,
          bold: true,
          color: "c91f37",
        }),
      ],
      spacing: { before: 120, after: 40 },
    }),
    ...desc.split("\n").map(
      (line) =>
        new Paragraph({
          text: line,
          indent: { left: 300 },
          spacing: { after: 40 },
          run: { font: "微软雅黑", size: 20 },
        }),
    ),
  ].flat();
}

function table(headers, rows, firstColBold = false) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              text: h,
              alignment: AlignmentType.CENTER,
              run: { font: "微软雅黑", size: 20, bold: true, color: "ffffff" },
            }),
          ],
          shading: { type: ShadingType.SOLID, color: "c91f37" },
          width: {
            size: h === "怎么测" ? 4500 : h === "☐" || h === "#" ? 600 : 1800,
            type: WidthType.DXA,
          },
        }),
    ),
  });

  const dataRows = rows.map(
    (row, ri) =>
      new TableRow({
        children: row.map(
          (cell, ci) =>
            new TableCell({
              children: [
                new Paragraph({
                  text: cell,
                  alignment:
                    ci === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                  run: {
                    font: "微软雅黑",
                    size: 19,
                    bold: firstColBold && ci === 0,
                  },
                }),
              ],
              shading:
                ri % 2 === 1
                  ? { type: ShadingType.SOLID, color: "fdf2f2" }
                  : undefined,
              width: {
                size:
                  cell === "怎么测"
                    ? 4500
                    : cell === "☐" || cell === "#"
                      ? 600
                      : 1800,
                type: WidthType.DXA,
              },
            }),
        ),
      }),
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "d9d9d9" },
    },
  });
}

// ── 生成文件 ──
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("C:/Users/bigbx/Desktop/huiping_tour/测试指南.docx", buf);
  console.log("✅ 已生成: 测试指南.docx");
});
