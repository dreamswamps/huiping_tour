// 证书解密工具
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 从环境变量读取解密密码
const SECRET = process.env.CERTS_SECRET;

if (!SECRET) {
  console.error('❌ 请在 .env 中设置 CERTS_SECRET');
}

// 加密证书的相对路径（相对于项目根目录）
const ENC_CERT_PATH = path.join(__dirname, '../certs/apiclient_key.enc');

// 缓存解密后的证书内容（避免重复解密）
let cachedCert = null;

/**
 * 解密证书，返回 PEM 格式的证书字符串
 */
function decryptCert() {
  // 如果已缓存，直接返回
  if (cachedCert) {
    return cachedCert;
  }

  try {
    // 读取加密文件
    const encryptedData = fs.readFileSync(ENC_CERT_PATH);

    // IV（前16字节）+ 加密数据
    const iv = encryptedData.subarray(0, 16);
    const encrypted = encryptedData.subarray(16);

    // 从密码派生32字节密钥（SHA-256）
    const key = crypto.createHash('sha256').update(SECRET).digest();

    // 解密
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    // 转为字符串并缓存
    cachedCert = decrypted.toString('utf-8');
    return cachedCert;
  } catch (error) {
    throw new Error('证书解密失败，请检查 CERTS_SECRET 是否正确');
  }
}

/**
 * 获取微信支付签名所需的私钥对象
 * 供 axios/请求库使用
 */
function getPrivateKey() {
  const certPem = decryptCert();
  return certPem;
}

/**
 * 清除缓存（用于热重载场景）
 */
function clearCache() {
  cachedCert = null;
}

module.exports = {
  decryptCert,
  getPrivateKey,
  clearCache,
};