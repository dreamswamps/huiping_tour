// 微信小程序（jscode2session）
// AppID 须与 miniprogram/project.config.json 一致；AppSecret 建议用环境变量，勿提交到仓库。
// Windows 本地：set WX_MINI_SECRET=你的AppSecret  再启动 node
const appid = (process.env.WX_MINI_APPID || "wx3f0567dc86f7ca12").trim();
const secret = (process.env.WX_MINI_SECRET || "").trim();

module.exports = {
  appid,
  secret,
};
