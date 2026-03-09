<template>
  <div class="workflow-view">
    <a-row class="mb-4 main-head">
      <a-col :span="20">工作流</a-col>
      <a-col :span="4" style="text-align: right;">
        <a @click="$router.push('/workflow/runs')">运行历史</a>
      </a-col>
    </a-row>

    <div class="main-body">
      <a-spin :spinning="loading">
        <a-row :gutter="24">
          <a-col :span="10">
            <h4 style="margin-bottom: 12px;">可用工作流</h4>
            <a-list
              :data-source="workflows"
              item-layout="horizontal"
            >
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta
                    :title="item.name"
                    :description="item.description"
                  />
                  <template #actions>
                    <a-button
                      type="primary"
                      size="small"
                      @click="selectWorkflow(item)"
                    >
                      选择
                    </a-button>
                  </template>
                </a-list-item>
              </template>
            </a-list>
          </a-col>
          <a-col :span="14">
            <template v-if="selected">
              <h4 style="margin-bottom: 12px;">执行：{{ selected.name }}</h4>
              <a-form
                layout="vertical"
                :model="form"
              >
                <a-form-item
                  v-for="key in inputKeys"
                  :key="key"
                  :label="inputLabel(key)"
                  :required="isRequired(key)"
                >
                  <a-textarea
                    v-model:value="form[key]"
                    :placeholder="inputPlaceholder(key)"
                    :rows="key === 'text' ? 5 : 3"
                  />
                </a-form-item>
                <a-form-item>
                  <a-button
                    type="primary"
                    :loading="running"
                    @click="run"
                  >
                    运行
                  </a-button>
                  <a-button
                    style="margin-left: 8px;"
                    :loading="runningAsync"
                    @click="runAsyncSelected"
                  >
                    异步运行
                  </a-button>
                  <a-button
                    style="margin-left: 8px;"
                    @click="clearSelection"
                  >
                    取消
                  </a-button>
                </a-form-item>
              </a-form>
              <div
                v-if="result !== null"
                class="result-box"
              >
                <h4 style="margin-bottom: 8px;">执行结果</h4>
                <a-alert
                  v-if="result.status === 'failed'"
                  type="error"
                  :message="result.output?.error || '执行失败'"
                  show-icon
                />
                <pre
                  v-else
                  class="result-pre"
                >{{ JSON.stringify(result.output, null, 2) }}</pre>
              </div>
            </template>
            <a-empty
              v-else
              description="请从左侧选择要执行的工作流"
            />
          </a-col>
        </a-row>
      </a-spin>
    </div>
  </div>
</template>

<script>
import { listWorkflows, runWorkflow } from '../api/Workflow.js'

export default {
  name: 'WorkflowView',
  data() {
    return {
      loading: false,
      workflows: [],
      selected: null,
      form: {},
      running: false,
      runningAsync: false,
      result: null,
    }
  },
  computed: {
    inputKeys() {
      if (!this.selected?.input_schema?.properties) return []
      return Object.keys(this.selected.input_schema.properties)
    },
  },
  async mounted() {
    await this.fetchWorkflows()
  },
  methods: {
    async fetchWorkflows() {
      this.loading = true
      try {
        const res = await listWorkflows()
        // 后端直接返回 { items: [...] }，axios 拦截器返回的就是 response.data
        this.workflows = res?.items ?? res?.data?.items ?? []
      } catch (e) {
        this.workflows = []
        console.error('listWorkflows failed', e)
      } finally {
        this.loading = false
      }
    },
    selectWorkflow(item) {
      this.selected = item
      this.form = this.initFormFromSchema(item)
      this.result = null
    },
    initFormFromSchema(item) {
      const props = item?.input_schema?.properties
      if (!props) return {}
      return Object.keys(props).reduce((acc, key) => {
        acc[key] = ''
        return acc
      }, {})
    },
    inputLabel(key) {
      const prop = this.selected?.input_schema?.properties?.[key]
      return (prop && prop.title) || key
    },
    inputPlaceholder(key) {
      const prop = this.selected?.input_schema?.properties?.[key]
      return (prop && prop.description) || ''
    },
    isRequired(key) {
      const required = this.selected?.input_schema?.required
      return Array.isArray(required) && required.includes(key)
    },
    clearSelection() {
      this.selected = null
      this.form = {}
      this.result = null
    },
    async run() {
      if (!this.selected) return
      this.running = true
      this.result = null
      try {
        const inputs = this.getInputs(this.selected, this.form)
        const res = await runWorkflow(this.selected.id, inputs)
        this.result = res?.data ?? res ?? { output: {}, status: 'succeeded' }
      } catch (e) {
        this.result = {
          status: 'failed',
          output: { error: e.response?.data?.detail || e.message || '请求失败' },
        }
      } finally {
        this.running = false
      }
    },
    getInputs(item, form) {
      const props = item?.input_schema?.properties
      if (!props) return {}
      return Object.keys(props).reduce((acc, key) => {
        acc[key] = form?.[key] ?? ''
        return acc
      }, {})
    },
    async runAsync(item) {
      if (!item) return
      try {
        const inputs = this.getInputs(item, this.initFormFromSchema(item))
        const res = await runWorkflow(item.id, inputs, true)
        const data = res?.data ?? res ?? {}
        const runId = data.run_id
        this.$message.success(runId ? `已提交异步运行，run_id: ${runId}，可到运行历史查看` : '已提交异步运行')
        if (runId) this.$router.push('/workflow/runs')
      } catch (e) {
        this.$message.error(e.response?.data?.detail || e.message || '异步运行请求失败')
      }
    },
    async runAsyncSelected() {
      if (!this.selected) return
      this.runningAsync = true
      try {
        const inputs = this.getInputs(this.selected, this.form)
        const res = await runWorkflow(this.selected.id, inputs, true)
        const data = res?.data ?? res ?? {}
        const runId = data.run_id
        this.$message.success(runId ? `已提交异步运行，run_id: ${runId}，可到运行历史查看` : '已提交异步运行')
        if (runId) this.$router.push('/workflow/runs')
      } catch (e) {
        this.$message.error(e.response?.data?.detail || e.message || '异步运行请求失败')
      } finally {
        this.runningAsync = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.workflow-view {
  .main-head {
    line-height: 80px;
    font-size: 32px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 16px;
  }
  .main-body {
    background-color: #ffffff;
    padding: 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .result-box {
    margin-top: 24px;
    padding: 16px;
    background: #fafafa;
    border-radius: 4px;
    border: 1px solid #f0f0f0;
  }
  .result-pre {
    margin: 0;
    padding: 12px;
    background: #fff;
    border: 1px solid #e8e8e8;
    border-radius: 4px;
    font-size: 12px;
    overflow: auto;
    max-height: 300px;
  }
}
</style>
