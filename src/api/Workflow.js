import axios from '../plugins/axios'

const WorkflowBaseUrl = '/api/workflow/workflows'

/**
 * 获取可用工作流列表
 * @returns {Promise<{ data: { items: Array<{ id, name, description, input_schema }> } }>}
 */
export async function listWorkflows() {
  return axios.get(WorkflowBaseUrl)
}

/**
 * 执行指定工作流
 * @param {string} workflowId - 工作流 ID
 * @param {Record<string, unknown>} inputs - 输入参数，如 { message: '...' }
 * @param {boolean} [asyncRun=false] - 是否异步执行，为 true 时返回 run_id 供轮询
 * @returns {Promise<{ data: { output?, status?, run_id? } }>}
 */
export async function runWorkflow(workflowId, inputs, asyncRun = false) {
  const params = asyncRun ? { async: 1 } : {}
  return axios.post(`${WorkflowBaseUrl}/${workflowId}/run`, { inputs }, { params })
}

/**
 * 列出运行历史
 * @param {number} [limit=50] - 条数
 * @returns {Promise<{ data: { items: Array } }>}
 */
export async function listRuns(limit = 50) {
  return axios.get('/api/workflow/runs', { params: { limit } })
}

/**
 * 查询某次执行的状态与结果
 * @param {string} runId - 运行 ID
 * @returns {Promise<{ data: { output, status, run_id, workflow_id, ... } }>}
 */
export async function getRun(runId) {
  return axios.get(`/api/workflow/runs/${runId}`)
}
