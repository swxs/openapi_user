// vue.config.js
const path = require('path')

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
  },
  configureWebpack: {
    resolve: {
      alias: {
        vue: '@vue/compat'
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            compilerOptions: {
              compatConfig: {
                MODE: 2
              }
            }
          }
        }
      ]
    }
  }
}
