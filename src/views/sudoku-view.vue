<template>
  <div class="sudoku-view">
    <a-row class="mb-4 main-head">
      数独谜题管理
    </a-row>

    <div class="main-body">
      <div class="main-tools" style="margin-bottom: 16px;">
        <a-upload
          :file-list="fileList"
          :before-upload="beforeUpload"
          :custom-request="handleUpload"
          accept="image/jpeg,image/png"
          @change="onUploadChange"
        >
          <a-button type="primary">上传数独图片</a-button>
        </a-upload>
        <span class="upload-tip">支持 JPEG、PNG，将解析为谜题并保存</span>
      </div>

      <a-table
        :data-source="tableData"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="id"
        style="width: 100%"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'create_at'">
            <span>{{ formatDate(record.create_at) }}</span>
          </template>
          <template v-else-if="column.key === 'puzzle_date'">
            <a-date-picker
              :value="getDraft(record).puzzle_date || undefined"
              value-format="YYYY/MM/DD"
              placeholder="选择日期"
              allow-clear
              style="width: 130px;"
              @change="(v) => setDraft(record.id, 'puzzle_date', v || null)"
            />
          </template>
          <template v-else-if="column.key === 'difficulty'">
            <a-select
              :value="getDraft(record).difficulty"
              placeholder="难度"
              allow-clear
              style="width: 90px;"
              :options="difficultyOptions"
              @change="(v) => setDraft(record.id, 'difficulty', v)"
            />
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button
              type="link"
              size="small"
              :disabled="!hasRowChange(record)"
              :loading="savingId === record.id"
              @click="saveRow(record)"
            >
              保存
            </a-button>
            <a-button type="link" size="small" @click="showDetail(record)">
              详情
            </a-button>
          </template>
        </template>
      </a-table>

      <div class="main-tools" style="margin-top: 16px;">
        <a-pagination
          v-model:current="currentPage"
          :page-size="pageSize"
          :total="total"
          :show-quick-jumper="true"
          :show-size-changer="false"
          @change="loadList"
        />
      </div>
    </div>

    <a-modal
      v-model:open="detailVisible"
      title="谜题详情"
      width="420px"
      :footer="null"
      @cancel="detailVisible = false"
    >
      <div v-if="currentPuzzle" class="sudoku-detail">
        <p class="detail-meta">
          <span v-if="currentPuzzle.puzzle_date">谜题日期：{{ currentPuzzle.puzzle_date }}</span>
          <span v-if="currentPuzzle.difficulty != null" class="ml-2">难度：{{ difficultyLabel(currentPuzzle.difficulty) }}</span>
          <span v-if="currentPuzzle.create_at" class="ml-2">创建：{{ formatDate(currentPuzzle.create_at) }}</span>
        </p>
        <div class="grid-wrap">
          <div class="grid-label">题目</div>
          <div class="sudoku-grid">
            <div
              v-for="(_, bi) in 9"
              :key="'p-block-' + bi"
              class="sudoku-block"
            >
              <div
                v-for="(_, ii) in 9"
                :key="'p-' + bi + '-' + ii"
                class="cell"
                :class="{ given: isGiven(cellIndex(bi, ii)) }"
              >
                {{ cellValue(currentPuzzle.puzzle, cellIndex(bi, ii)) }}
              </div>
            </div>
          </div>
        </div>
        <div class="grid-wrap">
          <div class="grid-label">答案</div>
          <div class="sudoku-grid">
            <div
              v-for="(_, bi) in 9"
              :key="'s-block-' + bi"
              class="sudoku-block"
            >
              <div
                v-for="(_, ii) in 9"
                :key="'s-' + bi + '-' + ii"
                class="cell"
              >
                {{ currentPuzzle.solution ? currentPuzzle.solution[cellIndex(bi, ii)] : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { listPuzzles, uploadSudokuImage, updatePuzzle } from '../api/Sudoku.js'
import { getDateFormat } from '../utils/dateUtils'

export default {
  name: 'SudokuView',
  data() {
    return {
      tableData: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      fileList: [],
      detailVisible: false,
      currentPuzzle: null,
      editingDrafts: {},
      savingId: null,
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
        { title: '创建时间', dataIndex: 'create_at', key: 'create_at', width: 180 },
        { title: '谜题时间', dataIndex: 'puzzle_date', key: 'puzzle_date', width: 150 },
        { title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 110 },
        { title: '操作', key: 'action', width: 140 },
      ],
      difficultyOptions: [
        { label: '简单', value: 1 },
        { label: '中等', value: 2 },
        { label: '困难', value: 3 },
      ],
    }
  },
  mounted() {
    this.loadList(1)
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '—'
      return getDateFormat(dateString)
    },
    beforeUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isImage) {
        this.$message.error('仅支持 JPEG、PNG 图片')
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        this.$message.error('图片大小不能超过10MB')
        return false
      }
      return true
    },
    handleUpload({ file, onSuccess, onError }) {
      uploadSudokuImage(file)
        .then((res) => {
          if (res && res.code === 0 && res.data && res.data.data) {
            this.$message.success('上传成功，已解析并保存谜题')
            this.fileList = []
            this.loadList(this.currentPage)
            onSuccess()
          } else {
            const msg = (res && res.message) || '上传失败'
            this.$message.error(msg)
            onError(new Error(msg))
          }
        })
        .catch((err) => {
          const msg = err?.message || err?.response?.data?.message || '上传失败'
          this.$message.error(msg)
          onError(err)
        })
    },
    onUploadChange({ fileList }) {
      this.fileList = fileList
    },
    async loadList(page = 1) {
      this.loading = true
      try {
        const res = await listPuzzles({
          use_pager: 1,
          page,
          page_number: this.pageSize,
        })
        this.tableData = (res.data && res.data.data) || []
        this.total = (res.data && res.data.pagination && res.data.pagination.total) || 0
        this.currentPage = page
        this.initDrafts()
      } catch (e) {
        this.$message.error(e?.message || '加载列表失败')
      } finally {
        this.loading = false
      }
    },
    initDrafts() {
      const next = {}
      this.tableData.forEach((r) => {
        next[r.id] = {
          puzzle_date: r.puzzle_date ?? null,
          difficulty: r.difficulty ?? null,
        }
      })
      this.editingDrafts = next
    },
    getDraft(record) {
      if (!this.editingDrafts[record.id]) {
        this.editingDrafts[record.id] = {
          puzzle_date: record.puzzle_date ?? null,
          difficulty: record.difficulty ?? null,
        }
      }
      return this.editingDrafts[record.id]
    },
    setDraft(id, field, value) {
      if (!this.editingDrafts[id]) this.editingDrafts[id] = { puzzle_date: null, difficulty: null }
      this.editingDrafts[id][field] = value
    },
    hasRowChange(record) {
      const d = this.editingDrafts[record.id]
      if (!d) return false
      const pd = record.puzzle_date ?? null
      const dd = record.difficulty ?? null
      return d.puzzle_date !== pd || d.difficulty !== dd
    },
    async saveRow(record) {
      const d = this.editingDrafts[record.id]
      if (!d || !this.hasRowChange(record)) return
      this.savingId = record.id
      try {
        const res = await updatePuzzle(record.id, {
          puzzle_date: d.puzzle_date,
          difficulty: d.difficulty,
        })
        if (res && res.code === 0 && res.data && res.data.data) {
          const data = res.data.data
          Object.assign(record, { puzzle_date: data.puzzle_date, difficulty: data.difficulty })
          this.editingDrafts[record.id] = {
            puzzle_date: data.puzzle_date ?? null,
            difficulty: data.difficulty ?? null,
          }
          this.$message.success('已保存')
        } else {
          this.$message.error((res && res.message) || '保存失败')
        }
      } catch (e) {
        this.$message.error(e?.message || '保存失败')
      } finally {
        this.savingId = null
      }
    },
    difficultyLabel(value) {
      const o = this.difficultyOptions.find((opt) => opt.value === value)
      return o ? o.label : '—'
    },
    showDetail(record) {
      this.currentPuzzle = record
      this.detailVisible = true
    },
    isGiven(idx) {
      if (!this.currentPuzzle || !this.currentPuzzle.puzzle) return false
      return this.currentPuzzle.puzzle[idx] !== '0' && this.currentPuzzle.puzzle[idx] !== undefined
    },
    cellValue(puzzle, idx) {
      if (!puzzle || puzzle[idx] === '0') return ''
      return puzzle[idx]
    },
    /** 由宫格索引(0~8)与宫内格索引(0~8)计算全局单元格索引(0~80) */
    cellIndex(blockIdx, innerIdx) {
      const br = Math.floor(blockIdx / 3)
      const bc = blockIdx % 3
      const r = Math.floor(innerIdx / 3)
      const c = innerIdx % 3
      return (br * 3 + r) * 9 + (bc * 3 + c)
    },
  },
}
</script>

<style lang="less" scoped>
.sudoku-view {
  .main-head {
    line-height: 80px;
    font-size: 24px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
    margin-bottom: 16px;
  }
  .main-body {
    background-color: #fff;
    padding: 24px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  .main-tools {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .upload-tip {
    color: rgba(0, 0, 0, 0.45);
    font-size: 12px;
  }
  .ml-2 {
    margin-left: 8px;
  }
}

.sudoku-detail {
  .detail-meta {
    margin-bottom: 16px;
    font-size: 12px;
    color: rgba(0, 0, 0, 0.65);
  }
  .grid-wrap {
    margin-bottom: 20px;
  }
  .grid-label {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.45);
    margin-bottom: 6px;
  }
  .sudoku-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    padding: 8px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    width: fit-content;
    background-color: #fafafa;
  }
  .sudoku-block {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
    border: 1px solid #e8e8e8;
    background-color: #fff;
  }
  .cell {
    width: 36px;
    height: 36px;
    line-height: 36px;
    text-align: center;
    border: 1px solid #f0f0f0;
    font-size: 14px;
    box-sizing: border-box;
  }
  .cell.given {
    font-weight: 600;
    background-color: #fafafa;
  }
}
</style>
