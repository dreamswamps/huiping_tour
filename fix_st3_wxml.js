const fs = require("fs");
const base =
  "C:\\Users\\bigbx\\Desktop\\huiping_tour\\miniprogram\\package-other\\stations\\3";
let wxml = fs.readFileSync(base + "\\index.wxml", "utf8");
if (wxml.charCodeAt(0) === 0xfeff) wxml = wxml.slice(1);

// Find the second wx:if occurrence (in the pledge-btn area) and replace with the button text ternary
let firstIdx = wxml.indexOf("wx:if");
let secondIdx = wxml.indexOf("wx:if", firstIdx + 10);
if (secondIdx > 0) {
  // Find the entire wx:if/wx:else block in the button area
  let blockStart = secondIdx - 14; // includes leading whitespace
  let blockEnd = wxml.indexOf("</text>", secondIdx);
  let endLine = wxml.indexOf("\n", blockEnd);
  let block = wxml.substring(blockStart, endLine);
  let replacement =
    "        <text>{{hasSigned ? '已完成签署' : '签署守护承诺书'}}</text>";
  wxml = wxml.replace(block, replacement);
  fs.writeFileSync(base + "\\index.wxml", wxml, "utf8");
  console.log("Fixed WXML: restored button text");
} else {
  console.log("Second wx:if not found");
}
