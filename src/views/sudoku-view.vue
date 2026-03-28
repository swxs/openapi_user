<template>
  <div class="sudoku-view">
    <div class="main-body">
      <a-table
        :data-source="tableData"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="id"
        style="width: 100%"
        :scroll="{ x: 680, y: TABLE_SCROLL_Y_10_ROWS }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'create_at'">
            <span>{{ formatDate(record.create_at) }}</span>
          </template>
          <template v-else-if="column.key === 'puzzle_date'">
            <span>{{ record.puzzle_date || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'difficulty'">
            <span>{{ difficultyLabel(record.difficulty) }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-button type="link" size="small" @click="openDetailModal(record)">
              详情
            </a-button>
          </template>
        </template>
      </a-table>

      <div class="main-tools">
        <a-button type="primary" @click="openManualModal">创建数独</a-button>
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
      v-model:open="manualVisible"
      wrap-class-name="ou-modal-shelf"
      :title="manualMode === 'create' ? '手动添加数独' : '谜题详情'"
      width="720px"
      ok-text="保存"
      cancel-text="取消"
      :confirm-loading="manualSubmitting"
      @ok="onManualModalOk"
      @cancel="manualVisible = false"
    >
      <div class="manual-modal-root sdm">
        <div v-if="manualMode === 'create'" class="sdm-callout sdm-callout--hint">
          <span class="sdm-callout__mark" aria-hidden="true" />
          <p class="sdm-callout__text">
            81 位题目，<strong>0</strong> 为空格；保存时需<strong>唯一解</strong>。可粘贴、盘面编辑或上传图片识别——请核对后再保存。
          </p>
        </div>
        <div v-else-if="manualViewRecord" class="sdm-callout sdm-callout--meta">
          <span class="sdm-callout__mark sdm-callout__mark--meta" aria-hidden="true" />
          <div class="sdm-callout__meta-inner">
            <p class="sdm-callout__hintline">
              可在下方修改谜题日期与难度，保存后生效。
            </p>
            <dl class="sdm-meta-dl">
              <div v-if="manualViewRecord.create_at" class="sdm-meta-dl__row">
                <dt>创建</dt>
                <dd class="sdm-meta-dl__val">{{ formatDate(manualViewRecord.create_at) }}</dd>
              </div>
              <div class="sdm-meta-dl__row sdm-meta-dl__row--id">
                <dt>ID</dt>
                <dd class="sdm-meta-dl__val sdm-meta-dl__val--id">
                  <code class="sdm-id-scroll" title="横向滑动查看完整 ID">{{ manualViewRecord.id }}</code>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <section v-if="manualMode === 'create'" class="sdm-card sdm-card--tools sdm-reveal" style="animation-delay: 0.03s">
          <header class="sdm-card__head">
            <span class="sdm-card__kicker">导入</span>
            <h3 class="sdm-card__title">图片识别</h3>
          </header>
          <div class="sdm-card__body sdm-tools">
            <a-upload
              :file-list="manualImageFileList"
              :before-upload="beforeModalImageUpload"
              :custom-request="handleModalImagePreview"
              accept="image/jpeg,image/png"
              :show-upload-list="false"
              @change="onManualImageUploadChange"
            >
              <a-button class="sdm-btn-upload">选择图片</a-button>
            </a-upload>
            <p class="sdm-tools__hint">仅填入表单、不落库；JPEG / PNG，最大 10MB</p>
          </div>
        </section>

        <section class="sdm-card sdm-card--fields sdm-reveal" style="animation-delay: 0.06s">
          <header class="sdm-card__head">
            <span class="sdm-card__kicker">元数据</span>
            <h3 class="sdm-card__title">日期与难度</h3>
          </header>
          <div class="sdm-card__body sdm-field-grid">
            <div class="sdm-field">
              <label class="sdm-field__label" for="sdm-puzzle-date">谜题日期</label>
              <a-date-picker
                id="sdm-puzzle-date"
                :value="manualPuzzleDate || undefined"
                value-format="YYYY/MM/DD"
                :placeholder="manualMode === 'create' ? '默认当天' : '可选'"
                allow-clear
                class="sdm-field__control sdm-field__control--date"
                @change="onManualDateChange"
              />
            </div>
            <div class="sdm-field">
              <label class="sdm-field__label" for="sdm-difficulty">难度</label>
              <a-select
                id="sdm-difficulty"
                :value="manualDifficulty"
                placeholder="可选"
                allow-clear
                class="sdm-field__control sdm-field__control--select"
                :options="difficultyOptions"
                @change="onManualDifficultyChange"
              />
            </div>
          </div>
        </section>

        <section class="sdm-card sdm-card--code sdm-reveal" style="animation-delay: 0.09s">
          <header class="sdm-card__head sdm-card__head--row">
            <div>
              <span class="sdm-card__kicker">字符串</span>
              <h3 class="sdm-card__title">数独代码</h3>
            </div>
            <a-button class="sdm-btn-copy" size="small" @click="copyManualCode">复制</a-button>
          </header>
          <div class="sdm-card__body">
            <a-input
              v-model:value="manualCodeDraft"
              :readonly="manualMode === 'view'"
              placeholder="粘贴 81 位；可含空格，. 与 _ 视为空，失焦规范为一行"
              class="sdm-code-input"
              @blur="onManualCodeBlur"
            />
          </div>
        </section>

        <section class="sdm-card sdm-card--board sdm-reveal" style="animation-delay: 0.12s">
          <header class="sdm-card__head">
            <span class="sdm-card__kicker">网格</span>
            <h3 class="sdm-card__title">题目</h3>
          </header>
          <div class="sdm-card__body sdm-board-shell">
            <div v-if="manualMode === 'view'" class="sudoku-grid manual-view-grid">
            <div
              v-for="bi in 9"
              :key="'vp-block-' + (bi - 1)"
              class="sudoku-block"
            >
              <div
                v-for="ii in 9"
                :key="'vp-' + (bi - 1) + '-' + (ii - 1)"
                class="cell"
                :class="{ given: manualCellIsGiven(cellIndex(bi - 1, ii - 1)) }"
              >
                {{ cellValue(manualPuzzle, cellIndex(bi - 1, ii - 1)) }}
              </div>
            </div>
            </div>
          <div v-else class="sudoku-grid manual-edit-grid">
            <div
              v-for="bi in 9"
              :key="'m-block-' + (bi - 1)"
              class="sudoku-block"
            >
              <div
                v-for="ii in 9"
                :key="'m-' + (bi - 1) + '-' + (ii - 1)"
                class="cell cell--edit"
                :class="{ given: manualCellIsGiven(cellIndex(bi - 1, ii - 1)) }"
              >
                <a-input
                  :bordered="false"
                  :value="manualCellDisplay(cellIndex(bi - 1, ii - 1))"
                  class="cell-edit-input"
                  maxlength="1"
                  @update:value="(v) => onManualCellInput(cellIndex(bi - 1, ii - 1), v)"
                />
              </div>
            </div>
            </div>
          </div>
        </section>

        <section
          v-if="manualMode === 'view' && manualViewRecord && manualViewRecord.solution"
          class="sdm-card sdm-card--answer sdm-reveal"
          style="animation-delay: 0.15s"
        >
          <header class="sdm-card__head">
            <span class="sdm-card__kicker">参考</span>
            <h3 class="sdm-card__title">答案</h3>
          </header>
          <div class="sdm-card__body sdm-board-shell">
            <div class="sudoku-grid manual-view-grid">
            <div
              v-for="bi in 9"
              :key="'vs-block-' + (bi - 1)"
              class="sudoku-block"
            >
              <div
                v-for="ii in 9"
                :key="'vs-' + (bi - 1) + '-' + (ii - 1)"
                class="cell"
              >
                {{ manualViewRecord.solution[cellIndex(bi - 1, ii - 1)] }}
              </div>
            </div>
            </div>
          </div>
        </section>
      </div>
    </a-modal>
  </div>
</template>

<script>
import { createPuzzle, listPuzzles, previewSudokuImage, updatePuzzle } from '../api/Sudoku.js'
import { getDateFormat } from '../utils/dateUtils'
import { TABLE_SCROLL_Y_10_ROWS } from '../constants/tableLayout.js'

export default {
  name: 'SudokuView',
  data() {
    return {
      tableData: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0,
      manualImageFileList: [],
      columns: [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 120, ellipsis: true },
        { title: '创建时间', dataIndex: 'create_at', key: 'create_at', width: 180 },
        { title: '谜题时间', dataIndex: 'puzzle_date', key: 'puzzle_date', width: 150 },
        { title: '难度', dataIndex: 'difficulty', key: 'difficulty', width: 110 },
        { title: '操作', key: 'action', width: 90 },
      ],
      difficultyOptions: [
        { label: '简单', value: 1 },
        { label: '中等', value: 2 },
        { label: '困难', value: 3 },
      ],
      manualVisible: false,
      manualMode: 'create',
      manualViewRecord: null,
      manualSubmitting: false,
      manualPuzzle: '',
      manualCodeDraft: '',
      manualPuzzleDate: undefined,
      manualDifficulty: undefined,
    }
  },
  computed: {
    manualModalFooter() {
      return this.manualMode === 'view' ? null : undefined
    },
  },
  mounted() {
    this.loadList(1)
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '—'
      return getDateFormat(dateString)
    },
    beforeModalImageUpload(file) {
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
    handleModalImagePreview({ file, onSuccess, onError }) {
      previewSudokuImage(file)
        .then((res) => {
          const inner = res && res.data && res.data.data
          if (res && res.code === 0 && inner && inner.puzzle) {
            const p = this.normalizeTo81(inner.puzzle)
            this.manualPuzzle = p
            this.applyCodeDraftFromPuzzle()
            this.manualImageFileList = []
            this.$message.success('已从图片填入题目，请核对日期、难度后点击保存')
            onSuccess()
          } else {
            const msg = (res && res.message) || '解析失败'
            this.$message.error(msg)
            onError(new Error(msg))
          }
        })
        .catch((err) => {
          const msg = err?.message || err?.response?.data?.message || '解析失败'
          this.$message.error(msg)
          onError(err)
        })
    },
    onManualImageUploadChange({ fileList }) {
      this.manualImageFileList = fileList
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
      } catch (e) {
        this.$message.error(e?.message || '加载列表失败')
      } finally {
        this.loading = false
      }
    },
    difficultyLabel(value) {
      const o = this.difficultyOptions.find((opt) => opt.value === value)
      return o ? o.label : '—'
    },
    openDetailModal(record) {
      this.manualMode = 'view'
      this.manualViewRecord = record
      this.manualPuzzle = record.puzzle || this.emptyManualPuzzle()
      this.manualCodeDraft = this.manualPuzzle
      this.manualPuzzleDate = record.puzzle_date || undefined
      this.manualDifficulty = record.difficulty
      this.manualVisible = true
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
    emptyManualPuzzle() {
      return '0'.repeat(81)
    },
    /** 新建态下全 0 题目在代码框用空串展示，占位符更易粘贴覆盖 */
    isAllZero81(p) {
      return typeof p === 'string' && /^0{81}$/.test(p)
    },
    applyCodeDraftFromPuzzle() {
      if (this.manualMode === 'create' && this.isAllZero81(this.manualPuzzle)) {
        this.manualCodeDraft = ''
      } else {
        this.manualCodeDraft = this.manualPuzzle
      }
    },
    todayPuzzleDateStr() {
      const d = new Date()
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${y}/${m}/${day}`
    },
    normalizeTo81(raw) {
      const out = []
      for (const c of String(raw ?? '')) {
        if (' \t\n\r'.includes(c)) continue
        if (c === '.' || c === '_') out.push('0')
        else if (c >= '0' && c <= '9') out.push(c)
      }
      while (out.length < 81) out.push('0')
      return out.slice(0, 81).join('')
    },
    openManualModal() {
      this.manualMode = 'create'
      this.manualViewRecord = null
      this.manualPuzzle = this.emptyManualPuzzle()
      this.manualCodeDraft = ''
      this.manualPuzzleDate = this.todayPuzzleDateStr()
      this.manualDifficulty = undefined
      this.manualImageFileList = []
      this.manualVisible = true
    },
    async onManualModalOk() {
      if (this.manualMode === 'create') {
        await this.submitManual()
      } else {
        await this.submitDetailMetaUpdate()
      }
    },
    onManualCodeBlur() {
      if (this.manualMode === 'create') this.syncManualCodeFromDraft()
    },
    onManualDateChange(v) {
      this.manualPuzzleDate = v || undefined
    },
    onManualDifficultyChange(v) {
      this.manualDifficulty = v
    },
    syncManualCodeFromDraft() {
      this.manualPuzzle = this.normalizeTo81(this.manualCodeDraft)
      this.applyCodeDraftFromPuzzle()
    },
    manualCellDisplay(idx) {
      const c = this.manualPuzzle[idx]
      return c === '0' ? '' : c
    },
    manualCellIsGiven(idx) {
      const c = this.manualPuzzle[idx]
      return c !== undefined && c !== '0'
    },
    onManualCellInput(idx, val) {
      const s = String(val ?? '').replace(/[^0-9]/g, '')
      let d = '0'
      if (s.length) {
        const last = s[s.length - 1]
        d = last >= '1' && last <= '9' ? last : '0'
      }
      const arr = this.manualPuzzle.split('')
      arr[idx] = d
      this.manualPuzzle = arr.join('')
      this.applyCodeDraftFromPuzzle()
    },
    async copyManualCode() {
      this.syncManualCodeFromDraft()
      const text = this.manualPuzzle
      try {
        await navigator.clipboard.writeText(text)
        this.$message.success('已复制到剪贴板')
      } catch {
        this.$message.error('复制失败，请手动选中复制')
      }
    },
    async submitManual() {
      this.syncManualCodeFromDraft()
      const puzzle = this.manualPuzzle
      if (!puzzle || puzzle.length !== 81) {
        this.$message.error('题目须为 81 位')
        throw new Error('validation')
      }
      if (!puzzle.includes('0')) {
        this.$message.error('题目须至少有一个空格（0）')
        throw new Error('validation')
      }
      const payload = { puzzle }
      if (this.manualPuzzleDate) payload.puzzle_date = this.manualPuzzleDate
      if (this.manualDifficulty != null) payload.difficulty = this.manualDifficulty
      this.manualSubmitting = true
      try {
        const res = await createPuzzle(payload)
        if (res && res.code === 0 && res.data && res.data.data) {
          this.$message.success('已保存谜题')
          this.manualVisible = false
          this.loadList(this.currentPage)
        } else {
          this.$message.error((res && res.message) || '保存失败')
          throw new Error('api')
        }
      } catch (e) {
        if (e && (e.message === 'validation' || e.message === 'api')) throw e
        const msg =
          e?.response?.data?.message || e?.message || '保存失败'
        this.$message.error(msg)
        throw e
      } finally {
        this.manualSubmitting = false
      }
    },
    async submitDetailMetaUpdate() {
      const rec = this.manualViewRecord
      if (!rec || !rec.id) {
        this.$message.error('无有效记录')
        throw new Error('validation')
      }
      const newPd = this.manualPuzzleDate ?? null
      const newDd = this.manualDifficulty ?? null
      const oldPd = rec.puzzle_date ?? null
      const oldDd = rec.difficulty ?? null
      if (newPd === oldPd && newDd === oldDd) {
        this.$message.info('未修改谜题日期或难度')
        throw new Error('validation')
      }
      const payload = {}
      if (newPd !== oldPd) payload.puzzle_date = newPd
      if (newDd !== oldDd) payload.difficulty = newDd
      this.manualSubmitting = true
      try {
        const res = await updatePuzzle(rec.id, payload)
        if (res && res.code === 0 && res.data && res.data.data) {
          const data = res.data.data
          Object.assign(rec, {
            puzzle_date: data.puzzle_date ?? null,
            difficulty: data.difficulty ?? null,
          })
          const row = this.tableData.find((r) => r.id === rec.id)
          if (row) {
            Object.assign(row, {
              puzzle_date: data.puzzle_date ?? null,
              difficulty: data.difficulty ?? null,
            })
          }
          this.manualPuzzleDate = data.puzzle_date || undefined
          this.manualDifficulty = data.difficulty
          this.$message.success('已保存')
          this.manualVisible = false
        } else {
          this.$message.error((res && res.message) || '保存失败')
          throw new Error('api')
        }
      } catch (e) {
        if (e && (e.message === 'validation' || e.message === 'api')) throw e
        const msg = e?.response?.data?.message || e?.message || '保存失败'
        this.$message.error(msg)
        throw e
      } finally {
        this.manualSubmitting = false
      }
    },
  },
}
</script>

<style lang="less" scoped>
.sudoku-view {
  .ml-2 {
    margin-left: 8px;
  }
}
</style>

<!-- 数独弹窗内部件样式；外壳与变量见 assets/style/modal-shelf.less -->
<style lang="less">
/* 入场：轻 stagger */
@keyframes sdm-reveal-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ou-modal-shelf .sdm-reveal {
  animation: sdm-reveal-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.ou-modal-shelf .sdm-callout {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-bottom: var(--sdm-space-lg);
  border-radius: var(--sdm-radius);
  border: 1px solid var(--sdm-line);
  background: #faf8f3;
}

.ou-modal-shelf .sdm-callout__mark {
  flex-shrink: 0;
  width: 4px;
  margin-top: 4px;
  min-height: 2.5em;
  background: var(--sdm-accent);
  border-radius: 2px;
}

.ou-modal-shelf .sdm-callout__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: var(--sdm-ink-soft);
}

.ou-modal-shelf .sdm-callout__text strong {
  color: var(--sdm-ink);
  font-weight: 600;
}

.ou-modal-shelf .sdm-callout--meta {
  align-items: stretch;
  gap: 12px;
  padding: 10px 12px;
  background: #f7f5f0;
}

.ou-modal-shelf .sdm-callout__mark--meta {
  align-self: stretch;
  width: 3px;
  min-height: unset;
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 2px;
  background: var(--sdm-accent);
  opacity: 0.85;
}

.ou-modal-shelf .sdm-callout__meta-inner {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-left: 4px;
}

.ou-modal-shelf .sdm-callout__hintline {
  margin: 0 0 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(212, 207, 196, 0.65);
  font-size: 12px;
  line-height: 1.5;
  color: var(--sdm-ink-soft);
}

.ou-modal-shelf .sdm-meta-dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.ou-modal-shelf .sdm-meta-dl__row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  font-size: 13px;
  line-height: 1.35;
}

.ou-modal-shelf .sdm-meta-dl__row dt {
  margin: 0;
  color: var(--sdm-ink-soft);
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.02em;
}

.ou-modal-shelf .sdm-meta-dl__val {
  margin: 0;
  min-width: 0;
  color: var(--sdm-ink);
  font-family: system-ui, 'Segoe UI', sans-serif;
  font-size: 13px;
}

.ou-modal-shelf .sdm-meta-dl__val--id {
  padding: 0;
}

.ou-modal-shelf .sdm-meta-dl__row--id {
  align-items: center;
}

.ou-modal-shelf .sdm-id-scroll {
  display: block;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 4px 8px;
  border: none;
  border-radius: 2px;
  background: rgba(28, 25, 23, 0.04);
  font-size: 12px;
  line-height: 1.4;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 500;
  color: var(--sdm-ink);
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}

.ou-modal-shelf .sdm-id-scroll::-webkit-scrollbar {
  height: 4px;
}

.ou-modal-shelf .sdm-id-scroll::-webkit-scrollbar-thumb {
  background: rgba(28, 25, 23, 0.18);
  border-radius: 2px;
}

.ou-modal-shelf .sdm-card {
  margin-bottom: var(--sdm-space-lg);
  border: 1px solid var(--sdm-line);
  border-radius: var(--sdm-radius);
  background: #fffcf7;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.ou-modal-shelf .sdm-card:last-child {
  margin-bottom: 0;
}

.ou-modal-shelf .sdm-card__head {
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(212, 207, 196, 0.65);
  background: #f7f4ee;
}

.ou-modal-shelf .sdm-card__head--row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ou-modal-shelf .sdm-card__kicker {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sdm-accent);
  margin-bottom: 2px;
}

.ou-modal-shelf .sdm-card__title {
  margin: 0;
  font-family: 'Noto Serif SC', 'Songti SC', serif;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--sdm-ink);
}

.ou-modal-shelf .sdm-card__body {
  padding: 12px 14px 14px;
}

.ou-modal-shelf .sdm-tools {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
}

.ou-modal-shelf .sdm-tools__hint {
  margin: 0;
  flex: 1 1 200px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--sdm-ink-soft);
}

.ou-modal-shelf .sdm-btn-upload.ant-btn {
  border-color: var(--sdm-line);
  color: var(--sdm-ink);
  background: #fff;
  font-weight: 500;
  border-radius: var(--sdm-radius);
}

.ou-modal-shelf .sdm-btn-upload.ant-btn:hover {
  border-color: var(--sdm-accent);
  color: var(--sdm-accent);
}

.ou-modal-shelf .sdm-btn-copy.ant-btn {
  border-radius: var(--sdm-radius);
  border-color: var(--sdm-accent);
  color: var(--sdm-accent);
  background: var(--sdm-accent-soft);
  font-family: 'Noto Serif SC', serif;
  font-weight: 500;
}

.ou-modal-shelf .sdm-btn-copy.ant-btn:hover {
  border-color: #9c3f33;
  color: #9c3f33;
}

.ou-modal-shelf .sdm-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px 20px;
}

.ou-modal-shelf .sdm-field__label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--sdm-ink-soft);
  margin-bottom: 6px;
  letter-spacing: 0.02em;
}

.ou-modal-shelf .sdm-field__control--date,
.ou-modal-shelf .sdm-field__control--date.ant-picker {
  width: 100%;
  max-width: 200px;
  border-radius: var(--sdm-radius);
}

.ou-modal-shelf .sdm-field__control--select {
  width: 100%;
  max-width: 200px;
}

.ou-modal-shelf .sdm-code-input.ant-input {
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 13px;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: var(--sdm-radius);
  border-color: var(--sdm-line);
  background: #fffef9;
  color: var(--sdm-ink);
}

.ou-modal-shelf .sdm-code-input.ant-input:focus,
.ou-modal-shelf .sdm-code-input.ant-input-focused {
  border-color: var(--sdm-accent);
  box-shadow: 0 0 0 2px var(--sdm-accent-soft);
}

.ou-modal-shelf .sdm-board-shell {
  display: flex;
  justify-content: center;
  padding-top: 4px;
}

/* 数独宫格 */
.ou-modal-shelf .manual-edit-grid.sudoku-grid,
.ou-modal-shelf .manual-view-grid.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(3, max-content);
  gap: 7px;
  padding: 10px;
  border: 1px solid var(--sdm-line);
  border-radius: var(--sdm-radius);
  width: fit-content;
  max-width: 100%;
  background: var(--sdm-paper-2);
  box-sizing: border-box;
}

.ou-modal-shelf .manual-edit-grid .sudoku-block,
.ou-modal-shelf .manual-view-grid .sudoku-block {
  display: grid;
  grid-template-columns: repeat(3, 36px);
  grid-template-rows: repeat(3, 36px);
  gap: 0;
  border: 1px solid #c4bdb0;
  background: #fffdf8;
  width: max-content;
  box-sizing: border-box;
}

.ou-modal-shelf .manual-edit-grid .cell,
.ou-modal-shelf .manual-view-grid .cell {
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  border: 1px solid #e5e0d4;
  font-size: 14px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  box-sizing: border-box;
  color: var(--sdm-ink);
}

.ou-modal-shelf .manual-edit-grid .cell.given,
.ou-modal-shelf .manual-view-grid .cell.given {
  font-weight: 600;
  background: var(--sdm-cell-fixed);
}

.ou-modal-shelf .manual-edit-grid .cell--edit {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ou-modal-shelf .manual-edit-grid .cell-edit-input {
  width: 100%;
  margin: 0;
  padding: 0;
}

/* bordered=false 时常与 ant-input 合并为同一 <input>，需同时匹配自身与包一层 wrapper 的情况 */
.ou-modal-shelf .manual-edit-grid .cell-edit-input.ant-input,
.ou-modal-shelf .manual-edit-grid .cell-edit-input .ant-input {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  text-align: center !important;
  padding: 0 !important;
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 400;
  color: var(--sdm-ink);
}

.ou-modal-shelf .manual-edit-grid .cell.given .cell-edit-input.ant-input,
.ou-modal-shelf .manual-edit-grid .cell.given .cell-edit-input .ant-input {
  font-weight: 600;
}

.ou-modal-shelf .manual-edit-grid .cell-edit-input.ant-input:focus,
.ou-modal-shelf .manual-edit-grid .cell-edit-input .ant-input:focus {
  box-shadow: none !important;
}
</style>
