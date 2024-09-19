<template>
  <div class="user-view">
    <el-row class="mb-4 main-head">
      文件管理
    </el-row>

    <div class="main-body">
      <el-table ref="multipleTable" :data="tableData" style="width: 100%">
        <el-table-column
          property="file_name"
          label="文件名"
          fixed="left"
          min-width="180"
        />
        <el-table-column label="上传时间时间" width="130">
          <template #default="file_info">
            <span>{{ formatDate(file_info.row.created) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="120">
          <template #default="file_info">
            <span>{{ formatSize(file_info.row.file_size) }}</span>
          </template>
        </el-table-column>
        <el-table-column property="description" label="备注" min-width="120" />
        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="file_info">
            <el-button
              link
              type="primary"
              size="mini"
              @click.prevent="download(file_info.row)"
            >
              下载
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider />

      <el-row class="mb-4 main-tools">
        <el-col :span="4" :offset="1">
          <el-upload
            class="upload"
            action="/api/upload/upload/"
            :on-success="handleSuccess"
            :fileList="fileList"
          >
            <el-button size="small" type="primary">点击上传</el-button>
          </el-upload>
        </el-col>
        <el-col :span="8" :offset="10">
          <el-pagination
            :current-page.sync="currentPage"
            :page-size="10"
            :small="true"
            :disabled="false"
            :background="true"
            :total.sync="total"
            layout="prev, pager, next, jumper"
            @current-change="handleCurrentChange"
          />
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { searchFileInfo } from '../api/FileInfo.js'
import { getDateFormat } from '../utils/dateUtils'

export default {
  name: 'fileView',
  components: {},
  data() {
    return {
      tableData: [],
      multipleSelection: [],
      currentPage: 1,
      total: 10,
      fileList: [],
    }
  },
  computed: {},
  created() {},
  async mounted() {
    // 数据表格
    this.handleCurrentChange(1)
  },
  methods: {
    formatDate(date) {
      return getDateFormat(date)
    },
    formatSize(size) {
      return size
    },
    async handleCurrentChange(val) {
      this.currentPage = val
      let result = await searchFileInfo({
        use_pager: 1,
        page: this.currentPage,
        page_number: 10,
        order_by: ['-updated'],
      })
      this.tableData = result.data.data
      this.total = result.data.pagination.total
    },
    download(fileInfo) {
      let routeData = this.$router.resolve({
        path: `/download/${fileInfo.id}`,
      })
      window.open(routeData.href, '_blank')
    },
    handleSuccess(response, file, fileList) {
      this.handleCurrentChange(this.currentPage)
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.el-header {
  .header-main {
    line-height: 70px;
    .user-settings {
      font-size: 28px;
    }
  }
}
.el-main {
  background-color: #fafbf6;
  .main-head {
    line-height: 80px;
    font-size: 32px;
  }
  .main-body {
    background-color: #ffffff;

    .main-tools {
      padding-bottom: 24px;
    }
  }
}
</style>
