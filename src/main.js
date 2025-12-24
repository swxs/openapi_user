import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from './plugins/axios'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

const app = createApp(App)

// 设置全局axios实例
app.config.globalProperties.$axios = axios

// 使用插件
app.use(router)
app.use(Antd)

app.mount('#app')
