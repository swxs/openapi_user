<template>
  <div class="user-view">
    <a-row class="mb-4 main-head">
      用户管理
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
          <template v-else-if="column.key === 'action'">
            <a-button
              type="link"
              size="small"
              @click.prevent="showDialog(record)"
            >
              更新
            </a-button>
          </template>
        </template>
      </a-table>

      <a-divider style="margin: 16px 0;" />

      <div class="main-tools">
        <a-button type="primary" @click="showDialog(null)">
          创建用户
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

    <user-info-dialog
      :visible="showUserInfoDialog"
      :editData="currentUser"
      :type="type"
      @close-dialog="closeDialog"
    ></user-info-dialog>
  </div>
</template>

<script>
import {
  searchUser,
  selectUser,
  searchUserAuth,
} from '../api/User.js'
import { getDateFormat } from '../utils/dateUtils'
import userInfoDialog from '../components/user-info-dialog'

export default {
  name: 'userView',
  components: {
    'user-info-dialog': userInfoDialog,
  },
  data() {
    return {
      tableData: [],
      multipleSelection: [],
      currentPage: 1,
      total: 10,
      showUserInfoDialog: false,
      currentUser: {},
      type: 'create',
      columns: [
        {
          title: '用户名',
          dataIndex: 'username',
          key: 'username',
          fixed: 'left',
          width: 180,
        },
        {
          title: '创建时间',
          dataIndex: 'create_at',
          key: 'create_at',
          width: 180,
        },
        {
          title: '手机号',
          dataIndex: 'phone',
          key: 'phone',
          width: 120,
        },
        {
          title: '邮箱',
          dataIndex: 'email',
          key: 'email',
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
    async handleCurrentChange(val) {
      this.currentPage = val
      let result = await searchUser({
        use_pager: 1,
        page: this.currentPage,
        page_number: 10,
        order_by: ['-updated'],
      })
      this.tableData = result.data.data
      this.total = result.data.pagination.total
    },
    showDialog(user) {
      if (user) {
        this.showUserInfoDialog = true
        this.currentUser = user
        this.type = 'update'
      } else {
        this.showUserInfoDialog = true
        this.currentUser = {}
        this.type = 'create'
      }
    },
    closeDialog() {
      this.handleCurrentChange(this.currentPage)
      this.showUserInfoDialog = false
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
