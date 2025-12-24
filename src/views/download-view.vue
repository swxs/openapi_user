<template>
  <div class="error">
    <h3>正在获取下载文件</h3>
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
    // 获取文件地址
    let filePath = await getPathInfo(this.file_id)
    window.open(filePath.data.path, '_blank')
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.error {
  margin: 50px auto;
}
</style>
