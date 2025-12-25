<template>
  <div class="user-view">
    <a-row class="mb-4 main-head">
      文件管理
    </a-row>

    <div class="main-body">
      <a-table 
        ref="multipleTable" 
        :dataSource="tableData" 
        :columns="columns"
        :pagination="false"
        style="width: 100%"
        :scroll="{ x: 800 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'create_at'">
            <span>{{ formatDate(record.create_at) }}</span>
          </template>
          <template v-else-if="column.key === 'file_size'">
            <span>{{ formatSize(record.file_size) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              type="link"
              size="small"
              @click.prevent="download(record)"
            >
              下载
            </a-button>
          </template>
        </template>
      </a-table>

      <a-divider style="margin: 16px 0;" />

      <div class="main-tools">
        <a-upload
          class="upload"
          action="/api/upload/upload/"
          @change="handleUploadChange"
          :fileList="fileList"
          :showUploadList="false"
        >
          <a-button type="primary">点击上传</a-button>
        </a-upload>
        <a-pagination
          v-model:current="currentPage"
          :page-size="10"
          :total="total"
          :show-quick-jumper="true"
          :show-size-changer="false"
          @change="handleCurrentChange"
        />
      </div>
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
      columns: [
        {
          title: '文件名',
          dataIndex: 'file_name',
          key: 'file_name',
          fixed: 'left',
          width: 200,
        },
        {
          title: '上传时间',
          dataIndex: 'create_at',
          key: 'create_at',
          width: 180,
        },
        {
          title: '文件大小',
          dataIndex: 'file_size',
          key: 'file_size',
          width: 120,
        },
        {
          title: '备注',
          dataIndex: 'description',
          key: 'description',
          width: 200,
        },
        {
          title: '操作',
          key: 'action',
          fixed: 'right',
          width: 100,
        },
      ],
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
      if (!size) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB', 'TB']
      let unitIndex = 0
      let fileSize = size
      while (fileSize >= 1024 && unitIndex < units.length - 1) {
        fileSize /= 1024
        unitIndex++
      }
      return `${fileSize.toFixed(2)} ${units[unitIndex]}`
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
    handleUploadChange(info) {
      if (info.file.status === 'done') {
        // 上传成功，刷新列表
        this.handleCurrentChange(this.currentPage)
        this.$message.success('文件上传成功')
      } else if (info.file.status === 'error') {
        this.$message.error('文件上传失败')
      }
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.user-view {
  .main-head {
    line-height: 80px;
    font-size: 24px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 16px;
  }
  .main-body {
    background-color: #ffffff;
    padding: 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    .main-tools {
      padding-top: 16px;
      padding-bottom: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }
}
</style>
