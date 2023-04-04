<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px">Aside</el-aside>
      <el-container>
        <el-header>Header</el-header>
        <el-main>Main</el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { getTokenInfo } from '../utils/auth'

export default {
  name: 'index',
  components: {},
  data() {
    return {}
  },
  computed: {},
  methods: {},
  created() {},
  mounted() {},
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less"></style>
