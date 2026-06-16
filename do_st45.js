const fs = require("fs");
const dirs = {
  "4": "C:\\Users\\bigbx\\Desktop\\huiping_tour\\miniprogram\\package-other\\stations\\4",
  "5": "C:\\Users\\bigbx\\Desktop\\huiping_tour\\miniprogram\\package-other\\stations\\5"
};
const subTitles = { "4": "《丰碑永铸》· 革命故事", "5": "《薪火延续》· 革命故事" };
const dataAnchors = { "4": "certUnlocked: false", "5": "declarationText: ''" };

[4, 5].forEach(id => {
  const dir = dirs[id];
  const sid = String(id);
  
  // ========== JS ==========
  let js = fs.readFileSync(dir + "\\index.js", "utf8");
  if (js.charCodeAt(0) === 0xFEFF) js = js.slice(1);

  // data: add isPlaying, audioSrc
  const anchor = dataAnchors[id];
  if (!js.includes("isPlaying:")) {
    js = js.replace(anchor, "isPlaying: false,\n    audioSrc: \"\",\n    " + anchor);
  }

  // onLoad: find and insert audio creation
  let lines = js.split("\n");
  let onLoadStart = -1, onLoadEnd = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "onLoad(options) {") onLoadStart = i;
    if (onLoadStart >= 0 && lines[i].trim() === "}," && i > onLoadStart && onLoadEnd < 0) { onLoadEnd = i; break; }
  }
  if (onLoadEnd > 0 && !js.includes("createInnerAudioContext")) {
    let audioLines = [
      '    this.setData({ audioSrc: config.svgsUrl + "/media/' + sid + '.MP3" });',
      '    this.innerAudioContext = wx.createInnerAudioContext();',
      '    this.innerAudioContext.onError(() => { this.setData({ isPlaying: false }); });',
      '    this.innerAudioContext.onEnded(() => { this.setData({ isPlaying: false }); });'
    ];
    lines.splice(onLoadEnd, 0, ...audioLines);
  }

  // onUnload before onBackToMap
  if (!js.includes("onUnload()")) {
    let closeIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "onBackToMap() {") { closeIdx = i; break; }
    }
    if (closeIdx >= 0) {
      lines.splice(closeIdx, 0, "  onUnload() {", "    if (this.innerAudioContext) { this.innerAudioContext.stop(); this.innerAudioContext.destroy(); this.innerAudioContext = null; }", "  },", "");
    }
  }

  // onPlayRadio before onNavigate
  if (!js.includes("onPlayRadio()")) {
    let navIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === "onNavigate() {") { navIdx = i; break; }
    }
    if (navIdx >= 0) {
      lines.splice(navIdx, 0, "  onPlayRadio() {", "    if (this.data.isPlaying) {", "      this.innerAudioContext.pause();", "      this.setData({ isPlaying: false });", "    } else {", "      this.innerAudioContext.src = this.data.audioSrc;", "      this.innerAudioContext.play();", "      this.setData({ isPlaying: true });", "    }", "  },", "");
    }
  }

  js = lines.join("\n");
  fs.writeFileSync(dir + "\\index.js", js, "utf8");
  console.log("Station " + sid + " JS done");

  // ========== WXML ==========
  let wxml = fs.readFileSync(dir + "\\index.wxml", "utf8");
  if (wxml.charCodeAt(0) === 0xFEFF) wxml = wxml.slice(1);

  let anchorTag = (id === 4) ? '<view class="torch-card">' : '<view class="wall-card">';
  let radioBlock = '\n    <!-- 收听广播剧卡片 -->\n    <view class="radio-card {{isPlaying ? \'playing\' : \'\'}}" bindtap="onPlayRadio">\n      <view class="radio-left">\n        <view class="radio-icon-wrap">\n          <image class="radio-main-icon" src="{{svgsUrl}}/svgs/svgs/station1-card-radio.svg" mode="aspectFit"></image>\n          <image class="radio-sub-icon" src="{{svgsUrl}}/svgs/svgs/station1-card-radiolabel.svg" mode="aspectFit"></image>\n        </view>\n        <view class="radio-text-wrap">\n          <text class="radio-title">收听广播剧</text>\n          <text class="radio-sub">' + subTitles[id] + '</text>\n        </view>\n      </view>\n      <image class="play-icon" src="{{isPlaying ? svgsUrl + \'/svgs/svgs/station1-pause.svg\' : svgsUrl + \'/svgs/svgs/station1-play-arrow.svg\'}}" mode="aspectFit"></image>\n    </view>\n';

  wxml = wxml.replace(anchorTag, radioBlock + anchorTag);
  fs.writeFileSync(dir + "\\index.wxml", wxml, "utf8");
  console.log("Station " + sid + " WXML done");

  // ========== WXSS ==========
  let wxss = fs.readFileSync(dir + "\\index.wxss", "utf8");
  if (wxss.charCodeAt(0) === 0xFEFF) wxss = wxss.slice(1);

  wxss += '\n\n/* Radio card styles */\n.radio-card {\n  width: 100%;\n  height: 184rpx;\n  background: #A80101;\n  border-radius: 40rpx;\n  box-shadow: 0 8rpx 13rpx rgba(0, 0, 0, 0.25);\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0 32rpx;\n  margin-bottom: 28rpx;\n  box-sizing: border-box;\n}\n.radio-left {\n  display: flex;\n  align-items: center;\n}\n.radio-icon-wrap {\n  width: 60rpx;\n  height: 60rpx;\n  position: relative;\n  flex-shrink: 0;\n}\n.radio-main-icon {\n  width: 56rpx;\n  height: 56rpx;\n}\n.radio-sub-icon {\n  width: 54rpx;\n  height: 54rpx;\n  position: absolute;\n  left: 6rpx;\n  top: 6rpx;\n}\n.radio-text-wrap {\n  display: flex;\n  flex-direction: column;\n  margin-left: 24rpx;\n}\n.radio-title {\n  font-size: 30rpx;\n  color: #F5E6C8;\n  font-weight: 700;\n  font-family: \'Noto Sans SC\', sans-serif;\n}\n.radio-sub {\n  font-size: 22rpx;\n  color: #C8A87A;\n  margin-top: 8rpx;\n  font-family: \'Noto Sans SC\', sans-serif;\n}\n.play-icon {\n  width: 44rpx;\n  height: 44rpx;\n}\n\n/* Playing state animation */\n.radio-card.playing {\n  box-shadow: 0 0 24rpx 8rpx rgba(168, 1, 1, 0.4), 0 8rpx 13rpx rgba(0, 0, 0, 0.25);\n  animation: radioPulse 1.5s ease-in-out infinite;\n}\n\n@keyframes radioPulse {\n  0%, 100% { box-shadow: 0 0 20rpx 6rpx rgba(168, 1, 1, 0.3), 0 8rpx 13rpx rgba(0, 0, 0, 0.25); }\n  50% { box-shadow: 0 0 36rpx 12rpx rgba(168, 1, 1, 0.6), 0 8rpx 13rpx rgba(0, 0, 0, 0.25); }\n}\n';

  fs.writeFileSync(dir + "\\index.wxss", wxss, "utf8");
  console.log("Station " + sid + " WXSS done");
});

console.log("All done");
