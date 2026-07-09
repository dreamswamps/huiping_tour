const fs = require("fs");
const p =
  "C:\\Users\\bigbx\\Desktop\\huiping_tour\\miniprogram\\package-other\\stations\\2";

// === JS ===
let js = fs.readFileSync(p + "\\index.js", "utf8");
js = js.replace(
  "isCheckedIn: false",
  'isPlaying: false,\n    audioSrc: "",\n    isCheckedIn: false',
);

let audioCode =
  '  this.setData({ audioSrc: config.svgsUrl + "/media/2.MP3" });\n    this.innerAudioContext = wx.createInnerAudioContext();\n    this.innerAudioContext.onError(() => { this.setData({ isPlaying: false }); });\n    this.innerAudioContext.onEnded(() => { this.setData({ isPlaying: false }); });\n  ';
js = js.replace(
  "onLoad(options) {\n    if (options && options.id) {\n      this.setData({ stationId: options.id });\n    }\n  }",
  "onLoad(options) {\n    if (options && options.id) {\n      this.setData({ stationId: options.id });\n    }\n" +
    audioCode +
    "}",
);

let unloadCode =
  "  onUnload() {\n    if (this.innerAudioContext) { this.innerAudioContext.stop(); this.innerAudioContext.destroy(); this.innerAudioContext = null; }\n  },\n\n";
js = js.replace("onBackToMap()", unloadCode + "  onBackToMap()");

let playBody =
  "    if (this.data.isPlaying) {\n      this.innerAudioContext.pause();\n      this.setData({ isPlaying: false });\n    } else {\n      this.innerAudioContext.src = this.data.audioSrc;\n      this.innerAudioContext.play();\n      this.setData({ isPlaying: true });\n    }";
js = js.replace(
  /onAnimationPlay\(\) \{[\s\S]*?\n  \}/,
  "onPlayRadio() {\n" + playBody + "\n  }",
);

fs.writeFileSync(p + "\\index.js", js, "utf8");
console.log("JS done");

// === WXML ===
let wxml = fs.readFileSync(p + "\\index.wxml", "utf8");
wxml = wxml.replace(
  'class="red-card"',
  "class=\"red-card {{isPlaying ? 'playing' : ''}}\"",
);
wxml = wxml.replace('bindtap="onAnimationPlay"', 'bindtap="onPlayRadio"');
wxml = wxml.replace(
  'src="{{svgsUrl}}/svgs/svgs/station2-play-arrow.svg"',
  "src=\"{{isPlaying ? svgsUrl + '/svgs/svgs/station2-pause.svg' : svgsUrl + '/svgs/svgs/station2-play-arrow.svg'}}\"",
);
fs.writeFileSync(p + "\\index.wxml", wxml, "utf8");
console.log("WXML done");

// === WXSS ===
let wxss = fs.readFileSync(p + "\\index.wxss", "utf8");
wxss +=
  "\n\n/* Playing state animation */\n.red-card.playing {\n  box-shadow: 0 0 24rpx 8rpx rgba(168, 1, 1, 0.4), 0 8rpx 13rpx rgba(0, 0, 0, 0.25);\n  animation: radioPulse 1.5s ease-in-out infinite;\n}\n\n@keyframes radioPulse {\n  0%, 100% { box-shadow: 0 0 20rpx 6rpx rgba(168, 1, 1, 0.3), 0 8rpx 13rpx rgba(0, 0, 0, 0.25); }\n  50% { box-shadow: 0 0 36rpx 12rpx rgba(168, 1, 1, 0.6), 0 8rpx 13rpx rgba(0, 0, 0, 0.25); }\n}\n";
fs.writeFileSync(p + "\\index.wxss", wxss, "utf8");
console.log("WXSS done");
console.log("All done");
