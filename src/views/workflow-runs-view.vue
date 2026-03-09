<template>
  <div class="workflow-runs-view">
    <a-row class="mb-4 main-head">
      运行历史
    </a-row>

    <div class="main-body">
      <a-spin :spinning="loading">
        <a-table
          :data-source="runs"
          :columns="columns"
          :pagination="false"
          row-key="run_id"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'succeeded' ? 'green' : record.status === 'failed' ? 'red' : 'blue'">
                {{ record.status }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button
                type="link"
                size="small"
                @click="showDetail(record)"
              >
                详情
              </a-button>
            </template>
          </template>
        </a-table>
        <a-button
          style="margin-top: 16px;"
          @click="fetchRuns"
        >
          刷新
        </a-button>
      </a-spin>

      <a-modal
        v-model:visible="detailVisible"
        title="运行详情"
        width="600px"
        :footer="null"
      >
        <template v-if="currentRun">
          <p><strong>run_id:</strong> {{ currentRun.run_id }}</p>
          <p><strong>workflow_id:</strong> {{ currentRun.workflow_id }}</p>
          <p><strong>status:</strong> {{ currentRun.status }}</p>
          <pre
            v-if="currentRun.output || currentRun.error"
            class="detail-pre"
          >{{ currentRun.error || JSON.stringify(currentRun.output, null, 2) }}</pre>
        </template>
      </a-modal>
    </div>
  </div>
</template>

<script>
import { listRuns, getRun } from '../api/Workflow.js'

export default {
  name: 'WorkflowRunsView',
  data() {
    return {
      loading: false,
      runs: [],
      detailVisible: false,
      currentRun: null,
      columns: [
        { title: 'run_id', dataIndex: 'run_id', key: 'run_id', ellipsis: true, width: 280 },
        { title: 'workflow_id', dataIndex: 'workflow_id', key: 'workflow_id', width: 120 },
        { title: 'status', dataIndex: 'status', key: 'status', width: 100 },
        { title: 'created_at', dataIndex: 'created_at', key: 'created_at', width: 200 },
        { title: '操作', key: 'action', width: 80 },
      ],
    }
  },
  async mounted() {
    await this.fetchRuns()
  },
  methods: {
    async fetchRuns() {
      this.loading = true
      try {
        const res = await listRuns()
        this.runs = res?.items ?? res?.data?.items ?? []
      } catch (e) {
        this.runs = []
        console.error('listRuns failed', e)
      } finally {
        this.loading = false
      }
    },
    async showDetail(record) {
      try {
        const res = await getRun(record.run_id)
        this.currentRun = res?.data ?? res
      } catch (e) {
        this.currentRun = { ...record, error: e.response?.data?.detail || e.message }
      }
      this.detailVisible = true
    },
  },
}
</script>

<style lang="less" scoped>
.workflow-runs-view {
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
  .detail-pre {
    margin-top: 12px;
    padding: 12px;
    background: #fafafa;
    border-radius: 4px;
    font-size: 12px;
    max-height: 300px;
    overflow: auto;
  }
}
</style>
