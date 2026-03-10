import axios from '../plugins/axios'

const SudokuBaseUrl = '/api/sudoku'

/**
 * 上传数独图片，解析并存储
 * @param {File} file - 图片文件
 * @returns {Promise<{ data: { data: { id, puzzle, solution, puzzle_date, ... } } }>}
 */
export async function uploadSudokuImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return axios.post(`${SudokuBaseUrl}/upload/`, formData, {
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
 * 按 ID 获取单条谜题
 */
export async function getPuzzle(id) {
  return axios.get(`${SudokuBaseUrl}/puzzles/${id}`)
}

/**
 * 按日期获取当日谜题
 * @param {string} date - YYYYMMDD（无分隔符）
 */
export async function getPuzzleByDate(date) {
  return axios.get(`${SudokuBaseUrl}/puzzles/by-date`, { params: { date } })
}

/**
 * 更新谜题部分字段（如 puzzle_date）
 * @param {string} id - 谜题 ID
 * @param {Object} data - { puzzle_date?: string (YYYY/MM/DD), difficulty?: number }
 */
export async function updatePuzzle(id, data) {
  return axios.patch(`${SudokuBaseUrl}/puzzles/${id}`, data)
}
