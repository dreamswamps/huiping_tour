App({
  onLaunch() {},

  globalData: {
    config: {
        apiKey: '8a8b8bf57494e3cc6026e5f5be0d4992',
        apiSecret: '8e61fcaf01484d85821447104caf5c80c702f2bf35cff43110de41d57ed264d6',
        crsAppId: 'c751839ced4806743d6cb0ce3a1e5055',
        clientEndUrl: 'https://413135cd27b08b20516644cd2520a649.cn1.crs.easyar.com:8443',
        jpegQuality: 0.7, //JPEG压缩质量，建议不低于70%
        minInterval: 1000, //最短的两次CRS请求间隔(ms)
    },        
}
})
