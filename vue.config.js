// vue.config.js
const path = require('path')

module.exports = {
  lintOnSave: false, // 禁用ESLint检查，避免extensions选项错误
  devServer: {
    port: 8083, // 指定启动端口为 8083
    hot: true, // 启用热模块替换（HMR），默认已启用，但显式声明更清晰
    open: true, // 自动打开浏览器
    client: {
      overlay: {
        errors: true,
        warnings: false, // 不显示警告覆盖层，只显示错误
        // 如果 runtimeErrors 配置不生效，可以尝试完全禁用运行时错误覆盖层
        // runtimeErrors: false, // 取消注释此行以完全禁用运行时错误覆盖层
        runtimeErrors: (error) => {
          // 过滤掉 ResizeObserver 相关的运行时错误
          const resizeObserverError = /ResizeObserver/i
          const errorMessage = error?.message || error?.toString() || ''
          if (resizeObserverError.test(errorMessage)) {
            return false // 不显示这个错误
          }
          return true // 显示其他错误
        },
      },
      webSocketTransport: 'ws', // 使用 WebSocket 传输
    },
    webSocketServer: 'ws', // 使用 WebSocket 服务器
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
        vue: 'vue' // 使用原始Vue 3，而非@vue/compat
      }
    }
  },
  chainWebpack: (config) => {
    // 确保 HMR 正常工作
    config.plugins.delete('preload')
    config.plugins.delete('prefetch')
  }
}
