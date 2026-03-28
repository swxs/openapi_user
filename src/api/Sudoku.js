import axios from '../plugins/axios'

const SudokuBaseUrl = '/api/sudoku'

/**
 * 上传数独图片，仅解析返回题目/答案字符串，不落库
 * @param {File} file
 * @returns {Promise<{ data: { data: { puzzle, solution } } }>}
 */
export async function previewSudokuImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${SudokuBaseUrl}/upload/preview/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/**
 * 谜题列表（分页）
 * @param {Object} params - use_pager, page, page_number, puzzle_date(YYYY/MM/DD), difficulty
 */
export async function listPuzzles(params) {
  return axios.get(`${SudokuBaseUrl}/puzzles/`, { params })
}

/**
 * 手动创建谜题（81 位 puzzle，0 为空；服务端校验唯一解）
 * @param {Object} data - { puzzle, puzzle_date?: string (YYYY/MM/DD), difficulty?: number }
 */
export async function createPuzzle(data) {
  return axios.post(`${SudokuBaseUrl}/puzzles/`, data)
}

/**
 * 更新谜题部分字段（日期、难度）
 * @param {string} id
 * @param {Object} data - { puzzle_date?: string, difficulty?: number }
 */
export async function updatePuzzle(id, data) {
  return axios.patch(`${SudokuBaseUrl}/puzzles/${id}`, data)
}
