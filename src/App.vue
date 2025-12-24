<template>
  <div id="app">
    <!--所有的页面都将加载到此处-->
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  components: {},
  created() {
    document.title = "用户管理"
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
