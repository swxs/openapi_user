<template>
  <div id="app">
    <el-container v-show="!login" class="login-block">
      <el-aside class="login-img img-block">
        <img src="./assets/img/login.png" />
      </el-aside>
      <el-main class="login-iframe">
        <iframe
          :src="src"
          ref="iframe"
          class="login"
          frameborder="0"
          scrolling="no"
        ></iframe>
      </el-main>
    </el-container>
    <!--所有的页面都将加载到此处-->
    <router-view v-if="login"></router-view>
  </div>
</template>

<script>
import { getToken, setToken, cleanRequests } from './utils/auth'

export default {
  name: 'App',
  components: {},
  data() {
    return {
      src: process.env.VUE_APP_AUTH_IFRAME_URL,
      login: false,
      iframeNeed: false,
      iframeReady: false,
      iframeWin: {},
    }
  },
  watch: {},
  methods: {
    sendMessage(data) {
      console.log(`parent send: `, data)
      // 外部vue向iframe内部传数据
      this.iframeWin.postMessage(data, '*')
    },
    async handleMessage(event) {
      // 根据上面制定的结构来解析iframe内部发回来的数据
      const data = event.data
      console.log(`parent get: `, data)
      switch (data.cmd) {
        case 'ready':
          this.iframeReady = true
          if (getToken()) {
            this.login = true
          } else {
            this.iframeNeed = true
          }
          if (this.iframeNeed) {
            this.sendMessage({
              cmd: 'getToken',
              params: {},
            })
          }
          break
        case 'getToken':
          this.iframeNeed = true
          if (this.iframeReady) {
            this.sendMessage({
              cmd: 'getToken',
              params: {},
            })
          }
          break
        case 'returnToken':
          // 业务逻辑
          let token = data.params.token
          if (token) {
            setToken(token)
            cleanRequests(token)
            this.login = true
          } else {
            this.login = false
          }
          this.iframeNeed = false
          break
      }
    },
  },
  created() {
    document.title = '用户管理'
  },
  beforeMount() {
    // 在外部vue的window上添加postMessage的监听，并且绑定处理函数handleMessage
    window.addEventListener('message', this.handleMessage)
  },
  mounted() {
    this.iframeWin = this.$refs.iframe.contentWindow
  },
  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage)
  },
}
</script>

<style lang="less">
@import './assets/fonts/iconfont.less';
@import './assets/style/base.less';
@import './assets/style/common.less';

.login-block {
  width: 20%;
  min-width: 800px;
  margin: 100px auto 0;

  .login-img {
    width: 40%;
    img {
      width: 100%;
    }
  }
  .login-iframe {
    overflow: hidden;
    padding: 0 20px;
    .login {
      width: 100%;
      height: 100%;
      border: 0px;
    }
  }
}

.img-block {
  overflow: hidden;
}
</style>
