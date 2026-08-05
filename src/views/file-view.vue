<template>
  <div class="user-view">
    <a-tabs v-model:activeKey="activeTab" @change="handleTabChange">
      <a-tab-pane key="files" tab="文件列表">
        <div class="main-body">
          <a-table
            ref="multipleTable"
            :dataSource="tableData"
            :columns="columns"
            :pagination="false"
            style="width: 100%"
            :scroll="{ x: 800, y: TABLE_SCROLL_Y_10_ROWS }"
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
                  @click.prevent="openCreateLinkModal(record)"
                >
                  创建链接
                </a-button>
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
      </a-tab-pane>

      <a-tab-pane key="links" tab="链接列表">
        <div class="main-body">
          <a-table
            :dataSource="linkTableData"
            :columns="linkColumns"
            :pagination="false"
            style="width: 100%"
            :scroll="{ x: 960, y: TABLE_SCROLL_Y_10_ROWS }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'create_at' || column.key === 'expires_at'">
                <span>{{ record[column.key] ? formatDate(record[column.key]) : '—' }}</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === 1 ? 'success' : 'default'">
                  {{ record.status === 1 ? '有效' : '已失效' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'url'">
                <span class="link-url" :title="record.url">{{ record.url || '—' }}</span>
              </template>
              <template v-else-if="column.key === 'action'">
                <a-button
                  type="link"
                  size="small"
                  :disabled="!record.url"
                  @click.prevent="copyText(record.url)"
                >
                  复制
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  :disabled="record.status !== 1"
                  @click.prevent="handleRevokeLink(record)"
                >
                  失效
                </a-button>
                <a-button
                  type="link"
                  size="small"
                  danger
                  @click.prevent="handleDeleteLink(record)"
                >
                  删除
                </a-button>
              </template>
            </template>
          </a-table>

          <div class="main-tools">
            <a-pagination
              v-model:current="linkCurrentPage"
              :page-size="10"
              :total="linkTotal"
              :show-quick-jumper="true"
              :show-size-changer="false"
              @change="handleLinkPageChange"
            />
          </div>
        </div>
      </a-tab-pane>
    </a-tabs>

    <a-modal
      v-model:open="createLinkVisible"
      title="创建分享链接"
      ok-text="创建"
      cancel-text="取消"
      :confirm-loading="createLinkLoading"
      @ok="submitCreateLink"
      @cancel="closeCreateLinkModal"
    >
      <a-form layout="vertical">
        <a-form-item label="关联文件">
          <a-input :value="createLinkForm.file_name" disabled />
        </a-form-item>
        <a-form-item label="链接名称" required>
          <a-input
            v-model:value="createLinkForm.name"
            placeholder="例如：Obsidian 笔记 A"
            maxlength="255"
          />
        </a-form-item>
        <a-form-item label="备注">
          <a-textarea
            v-model:value="createLinkForm.description"
            placeholder="可选，说明链接用途"
            :rows="3"
          />
        </a-form-item>
        <a-form-item label="过期时间">
          <a-date-picker
            v-model:value="createLinkForm.expires_at"
            show-time
            value-format="YYYY-MM-DD HH:mm:ss"
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="可选，留空则永久有效"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script>
import {
  searchFileInfo,
  searchShareLink,
  createShareLink,
  revokeShareLink,
  deleteShareLink,
} from '../api/FileInfo.js'
import { getDateFormat } from '../utils/dateUtils'
import { TABLE_SCROLL_Y_10_ROWS } from '../constants/tableLayout.js'

export default {
  name: 'fileView',
  components: {},
  data() {
    return {
      activeTab: 'files',
      tableData: [],
      currentPage: 1,
      total: 10,
      fileList: [],
      linkTableData: [],
      linkCurrentPage: 1,
      linkTotal: 0,
      createLinkVisible: false,
      createLinkLoading: false,
      createLinkForm: {
        file_info_id: '',
        file_name: '',
        name: '',
        description: '',
        expires_at: null,
      },
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
          width: 180,
        },
      ],
      linkColumns: [
        {
          title: '链接名称',
          dataIndex: 'name',
          key: 'name',
          fixed: 'left',
          width: 160,
        },
        {
          title: '文件名',
          dataIndex: 'file_name',
          key: 'file_name',
          width: 160,
        },
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 90,
        },
        {
          title: '过期时间',
          dataIndex: 'expires_at',
          key: 'expires_at',
          width: 170,
        },
        {
          title: '创建时间',
          dataIndex: 'create_at',
          key: 'create_at',
          width: 170,
        },
        {
          title: '链接',
          dataIndex: 'url',
          key: 'url',
          width: 220,
        },
        {
          title: '操作',
          key: 'action',
          fixed: 'right',
          width: 180,
        },
      ],
    }
  },
  async mounted() {
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
    handleTabChange(key) {
      if (key === 'links') {
        this.handleLinkPageChange(1)
      }
    },
    async handleCurrentChange(val) {
      this.currentPage = val
      const result = await searchFileInfo({
        use_pager: 1,
        page: this.currentPage,
        page_number: 10,
        order_by: ['-updated'],
      })
      this.tableData = result.data.data
      this.total = result.data.pagination.total
    },
    async handleLinkPageChange(val) {
      this.linkCurrentPage = val
      const result = await searchShareLink({
        use_pager: 1,
        page: this.linkCurrentPage,
        page_number: 10,
        order_by: ['-updated'],
      })
      this.linkTableData = result.data.data
      this.linkTotal = result.data.pagination.total
    },
    download(fileInfo) {
      const routeData = this.$router.resolve({
        path: `/download/${fileInfo.id}`,
      })
      window.open(routeData.href, '_blank')
    },
    openCreateLinkModal(fileInfo) {
      this.createLinkForm = {
        file_info_id: fileInfo.id,
        file_name: fileInfo.file_name,
        name: '',
        description: '',
        expires_at: null,
      }
      this.createLinkVisible = true
    },
    closeCreateLinkModal() {
      this.createLinkVisible = false
    },
    async submitCreateLink() {
      if (!this.createLinkForm.name?.trim()) {
        this.$message.warning('请填写链接名称')
        return
      }
      this.createLinkLoading = true
      try {
        const payload = {
          file_info_id: this.createLinkForm.file_info_id,
          name: this.createLinkForm.name.trim(),
          description: this.createLinkForm.description?.trim() || undefined,
        }
        if (this.createLinkForm.expires_at) {
          payload.expires_at = this.createLinkForm.expires_at
        }
        const result = await createShareLink(payload)
        if (result.code !== 0 || !result.data?.data) {
          this.$message.error(result.message || '创建链接失败')
          return
        }
        const url = result.data.data.url
        this.createLinkVisible = false
        if (url) {
          await this.copyText(url, true)
          this.$message.success('链接已创建并复制到剪贴板')
        } else {
          this.$message.success('链接已创建')
        }
        if (this.activeTab === 'links') {
          this.handleLinkPageChange(this.linkCurrentPage)
        }
      } catch (error) {
        this.$message.error('创建链接失败')
      } finally {
        this.createLinkLoading = false
      }
    },
    async copyText(text, silent = false) {
      if (!text) return
      await navigator.clipboard.writeText(text)
      if (!silent) {
        this.$message.success('链接已复制')
      }
    },
    async handleRevokeLink(record) {
      try {
        const result = await revokeShareLink(record.id)
        if (result.code !== 0) {
          this.$message.error(result.message || '失效操作失败')
          return
        }
        this.$message.success('链接已失效')
        this.handleLinkPageChange(this.linkCurrentPage)
      } catch (error) {
        this.$message.error('失效操作失败')
      }
    },
    async handleDeleteLink(record) {
      try {
        const result = await deleteShareLink(record.id)
        if (result.code !== 0) {
          this.$message.error(result.message || '删除失败')
          return
        }
        this.$message.success('链接已删除')
        this.handleLinkPageChange(this.linkCurrentPage)
      } catch (error) {
        this.$message.error('删除失败')
      }
    },
    handleUploadChange(info) {
      if (info.file.status === 'done') {
        this.handleCurrentChange(this.currentPage)
        this.$message.success('文件上传成功')
      } else if (info.file.status === 'error') {
        this.$message.error('文件上传失败')
      }
    },
  },
}
</script>

<style lang="less" scoped>
.link-url {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>
