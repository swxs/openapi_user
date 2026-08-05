<template>
  <div class="user-view">
    <div class="main-body">
      <a-table
        :dataSource="tableData"
        :columns="columns"
        :loading="loading"
        :pagination="false"
        style="width: 100%"
        :scroll="{ x: 960, y: TABLE_SCROLL_Y_10_ROWS }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'create_at'">
            <span>{{ formatDate(record.create_at) }}</span>
          </template>
          <template v-else-if="column.key === 'is_active'">
            <a-tag :color="record.is_active === 1 ? 'success' : 'default'">
              {{ record.is_active === 1 ? '已启用' : '已禁用' }}
            </a-tag>
          </template>
        </template>
      </a-table>

      <div class="main-tools">
        <a-button type="primary" @click="openCreateModal">
          创建应用
        </a-button>
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

    <a-modal
      wrap-class-name="ou-modal-shelf"
      :open="showCreateModal"
      title="创建应用"
      width="520px"
      :confirm-loading="creating"
      ok-text="创建"
      cancel-text="取消"
      @ok="handleCreate"
      @cancel="closeCreateModal"
    >
      <div class="ou-modal-shelf-inner">
        <a-form :model="createForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="应用名称" required>
            <a-input
              v-model:value="createForm.client_name"
              autocomplete="off"
              placeholder="请输入应用名称"
            />
          </a-form-item>
          <a-form-item label="重定向 URI" required>
            <a-input
              v-model:value="createForm.redirect_uri"
              autocomplete="off"
              placeholder="https://example.com/oauth/callback"
            />
          </a-form-item>
        </a-form>
      </div>
    </a-modal>

    <a-modal
      wrap-class-name="ou-modal-shelf"
      :open="showCredentialModal"
      title="应用凭证"
      width="560px"
      :footer="null"
      @cancel="closeCredentialModal"
    >
      <div class="ou-modal-shelf-inner">
        <a-alert
          type="warning"
          show-icon
          message="密钥仅展示一次，请立即保存"
          class="apps-credential-alert"
        />
        <div class="apps-credential-list">
          <div v-for="item in credentialFields" :key="item.key" class="apps-credential-row">
            <span class="apps-credential-label">{{ item.label }}</span>
            <div class="apps-credential-value">
              <code>{{ credentials[item.key] }}</code>
              <a-button type="link" size="small" @click="copyField(item.key, item.label)">
                <CopyOutlined />
                复制
              </a-button>
            </div>
          </div>
        </div>
        <div class="apps-credential-footer">
          <a-button type="primary" @click="closeCredentialModal">我已保存</a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { message } from 'ant-design-vue'
import { CopyOutlined } from '@ant-design/icons-vue'
import { searchOAuthClient, createOAuthClient } from '../api/OAuthClient.js'
import { getDateFormat } from '../utils/dateUtils'
import { TABLE_SCROLL_Y_10_ROWS } from '../constants/tableLayout.js'

export default {
  name: 'appsView',
  components: {
    CopyOutlined,
  },
  data() {
    return {
      TABLE_SCROLL_Y_10_ROWS,
      tableData: [],
      currentPage: 1,
      total: 0,
      loading: false,
      creating: false,
      showCreateModal: false,
      showCredentialModal: false,
      createForm: {
        client_name: '',
        redirect_uri: '',
      },
      credentials: {
        client_id: '',
        client_secret: '',
        client_name: '',
        redirect_uri: '',
      },
      credentialFields: [
        { key: 'client_id', label: 'Client ID' },
        { key: 'client_secret', label: 'Client Secret' },
        { key: 'client_name', label: '应用名称' },
        { key: 'redirect_uri', label: '重定向 URI' },
      ],
      columns: [
        {
          title: '应用名称',
          dataIndex: 'client_name',
          key: 'client_name',
          fixed: 'left',
          width: 180,
        },
        {
          title: 'Client ID',
          dataIndex: 'client_id',
          key: 'client_id',
          width: 220,
        },
        {
          title: '重定向 URI',
          dataIndex: 'redirect_uri',
          key: 'redirect_uri',
          width: 280,
          ellipsis: true,
        },
        {
          title: '状态',
          dataIndex: 'is_active',
          key: 'is_active',
          width: 100,
        },
        {
          title: '创建时间',
          dataIndex: 'create_at',
          key: 'create_at',
          width: 180,
        },
      ],
    }
  },
  async mounted() {
    await this.handleCurrentChange(1)
  },
  methods: {
    formatDate(date) {
      return getDateFormat(date)
    },
    async handleCurrentChange(page) {
      this.currentPage = page
      this.loading = true
      try {
        const result = await searchOAuthClient({
          use_pager: 1,
          page: this.currentPage,
          page_number: 10,
          order_by: ['-updated'],
        })
        this.tableData = result.data?.data || []
        this.total = result.data?.pagination?.total || 0
      } finally {
        this.loading = false
      }
    },
    openCreateModal() {
      this.createForm = {
        client_name: '',
        redirect_uri: '',
      }
      this.showCreateModal = true
    },
    closeCreateModal() {
      this.showCreateModal = false
      this.creating = false
    },
    validateCreateForm() {
      const name = this.createForm.client_name?.trim()
      const uri = this.createForm.redirect_uri?.trim()

      if (!name) {
        message.warning('请输入应用名称')
        return false
      }
      if (!uri) {
        message.warning('请输入重定向 URI')
        return false
      }
      try {
        const parsed = new URL(uri)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          message.warning('重定向 URI 须以 http:// 或 https:// 开头')
          return false
        }
      } catch {
        message.warning('请输入有效的重定向 URI')
        return false
      }
      return true
    },
    async handleCreate() {
      if (!this.validateCreateForm()) {
        return
      }

      this.creating = true
      try {
        const result = await createOAuthClient({
          client_name: this.createForm.client_name.trim(),
          redirect_uri: this.createForm.redirect_uri.trim(),
        })

        const created = result.data?.data
        if (!created?.client_id || !created?.client_secret) {
          message.error(result.message || '创建失败，请稍后重试')
          return
        }

        this.showCreateModal = false
        this.credentials = {
          client_id: created.client_id,
          client_secret: created.client_secret,
          client_name: created.client_name,
          redirect_uri: created.redirect_uri,
        }
        this.showCredentialModal = true
        await this.handleCurrentChange(1)
        message.success('应用创建成功')
      } catch (error) {
        message.error(error?.message || '创建失败，请稍后重试')
      } finally {
        this.creating = false
      }
    },
    closeCredentialModal() {
      this.showCredentialModal = false
      this.credentials = {
        client_id: '',
        client_secret: '',
        client_name: '',
        redirect_uri: '',
      }
    },
    async copyField(key, label) {
      const value = this.credentials[key]
      if (!value) {
        message.warning('没有可复制的内容')
        return
      }

      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(value)
        } else {
          const textarea = document.createElement('textarea')
          textarea.value = value
          textarea.style.position = 'fixed'
          textarea.style.opacity = '0'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        message.success(`${label} 已复制`)
      } catch {
        message.error('复制失败，请手动复制')
      }
    },
  },
}
</script>

<style lang="less" scoped>
.apps-credential-alert {
  margin-bottom: 16px;
}

.apps-credential-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.apps-credential-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.apps-credential-label {
  font-size: 12px;
  color: var(--ou-ink-muted, #5c6575);
  font-weight: 500;
}

.apps-credential-value {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--ou-surface, #faf7f2);
  border: 1px solid var(--ou-border, rgba(12, 15, 20, 0.09));

  code {
    flex: 1;
    min-width: 0;
    word-break: break-all;
    font-size: 13px;
    color: var(--ou-ink, #0c0f14);
  }
}

.apps-credential-footer {
  margin-top: 20px;
  text-align: right;
}
</style>
