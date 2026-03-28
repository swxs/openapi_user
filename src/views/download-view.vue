<template>
  <div class="ou-state-page ou-state-page--download">
    <div class="ou-state-page__mark" />
    <h1 class="ou-state-page__title">正在准备下载</h1>
    <p class="ou-state-page__desc">
      正在解析文件地址，浏览器将打开新窗口。若长时间无响应，请返回文件管理重试。
    </p>
  </div>
</template>

<script>
import { getPathInfo } from '../api/FileInfo.js'

export default {
  name: 'downloadView',
  data() {
    return {
      file_id: this.$route.params.file_id,
    }
  },
  async mounted() {
    const filePath = await getPathInfo(this.file_id)
    window.open(filePath.data.path, '_blank')
  },
}
</script>

<style lang="less" scoped>
.ou-state-page--download {
  animation: ou-fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
