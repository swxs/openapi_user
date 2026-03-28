<template>
  <div class="ou-state-page ou-state-page--404">
    <div class="ou-state-page__mark" />
    <h1 class="ou-state-page__title">页面不存在</h1>
    <p class="ou-state-page__desc">
      该路由未注册或链接已失效。请从侧栏返回已授权的功能模块。
    </p>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style lang="less" scoped>
.ou-state-page--404 {
  animation: ou-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
