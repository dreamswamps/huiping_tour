const secret = (process.env.JWT_SECRET || "").trim();

if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("生产环境必须配置环境变量 JWT_SECRET");
}

module.exports = {
  secret: secret || "hpt-dev-jwt-secret-change-me",
  expiresIn: process.env.JWT_EXPIRES_IN || "30d",
};
