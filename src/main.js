import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from './plugins/axios'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'

// 抑制 ResizeObserver 循环警告
// 这是浏览器的一个已知问题，当 ResizeObserver 回调中触发布局变化时会触发循环
const resizeObserverLoopErrRe = /ResizeObserver/i

// 处理 console.error
const originalError = console.error
console.error = (...args) => {
  const errorMessage = args[0]?.toString() || ''
  if (resizeObserverLoopErrRe.test(errorMessage)) {
    return // 忽略 ResizeObserver 相关错误
  }
  originalError.apply(console, args)
}

// 处理 window.onerror（在 webpack-dev-server 捕获之前）
const originalWindowError = window.onerror
window.onerror = (message, source, lineno, colno, error) => {
  const errorMessage = message?.toString() || ''
  if (resizeObserverLoopErrRe.test(errorMessage)) {
    return true // 阻止错误传播，防止 webpack-dev-server 显示覆盖层
  }
  if (originalWindowError) {
    return originalWindowError(message, source, lineno, colno, error)
  }
  return false
}

// 处理未捕获的 Promise 错误
const originalUnhandledRejection = window.onunhandledrejection
window.onunhandledrejection = (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  if (resizeObserverLoopErrRe.test(errorMessage)) {
    event.preventDefault() // 阻止默认的错误处理
    return
  }
  if (originalUnhandledRejection) {
    return originalUnhandledRejection(event)
  }
}

const app = createApp(App)

// 设置全局axios实例
app.config.globalProperties.$axios = axios

// 使用插件
app.use(router)
app.use(Antd)

app.mount('#app')
