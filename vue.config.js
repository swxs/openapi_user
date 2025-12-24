// vue.config.js
module.exports = {
  devServer: {
    port: 8083, // 指定启动端口为 8083
    proxy: {
      '/api': {
        target: 'http://localhost:8090/api/',
        changeOrigin: false,
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  }
}
