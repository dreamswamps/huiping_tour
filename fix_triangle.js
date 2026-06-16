const fs = require("fs");
const fp = "C:\\Users\\bigbx\\Desktop\\huiping_tour\\miniprogram\\package-guide\\voice-guide\\index.wxml";
let buf = fs.readFileSync(fp);
let search = Buffer.from("play-tri\"");
let idx = buf.indexOf(search);
if (idx >= 0) {
  let start = idx + 11;
  console.log("Corrupted bytes:", buf.slice(start, start + 4).toString("hex"));
  let triangle = Buffer.from("\u25B6", "utf8");
  let out = Buffer.concat([buf.slice(0, start), triangle, buf.slice(start + 4)]);
  fs.writeFileSync(fp, out);
  console.log("Fixed triangle character");
} else {
  console.log("Pattern not found");
}
