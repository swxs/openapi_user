<template>
  <a-config-provider :theme="antdTheme">
    <div id="app" class="openapi-app-root">
      <router-view />
    </div>
  </a-config-provider>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      antdTheme: {
        token: {
          colorPrimary: '#c9722e',
          colorInfo: '#1f8a7a',
          colorSuccess: '#1f8a7a',
          borderRadius: 10,
          fontFamily: "'Source Sans 3', 'Source Han Sans SC', 'Microsoft YaHei', sans-serif",
          fontFamilyCode: "'IBM Plex Mono', Consolas, monospace",
        },
        components: {
          Layout: {
            headerBg: '#faf7f2',
            bodyBg: 'transparent',
            siderBg: '#12181f',
          },
          Menu: {
            darkItemBg: 'transparent',
            darkItemSelectedBg: 'rgba(201, 114, 46, 0.14)',
            darkItemHoverBg: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    }
  },
  created() {
    document.title = '用户管理'
  },
}
</script>

<style lang="less">
@import './assets/fonts/iconfont.less';
@import './assets/style/base.less';
@import './assets/style/common.less';
@import './assets/style/global-overrides.less';
@import './assets/style/modal-shelf.less';

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
