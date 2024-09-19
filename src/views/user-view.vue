<template>
  <div class="user-view">
    <el-row class="mb-4 main-head">
      用户管理
    </el-row>

    <div class="main-body">
      <el-table ref="multipleTable" :data="tableData" style="width: 100%">
        <el-table-column
          property="username"
          label="用户名"
          fixed="left"
          min-width="180"
        />
        <el-table-column label="创建时间" width="130">
          <template #default="user">
            <span>{{ formatDate(user.row.created) }}</span>
          </template>
        </el-table-column>
        <el-table-column property="phone" label="手机号" width="120" />
        <el-table-column property="email" label="邮箱" min-width="120" />
        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="user">
            <el-button
              link
              type="primary"
              size="mini"
              @click.prevent="showDialog(user.row)"
            >
              更新
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-divider />

      <el-row class="mb-4 main-tools">
        <el-col :span="4" :offset="1">
          <el-button type="primary" size="mini" @click="showDialog(null)">
            创建用户
          </el-button>
        </el-col>
        <el-col :span="8" :offset="10">
          <el-pagination
            :current-page.sync="currentPage"
            :page-size="10"
            :small="true"
            :disabled="false"
            :background="true"
            :total.sync="total"
            layout="prev, pager, next, jumper"
            @current-change="handleCurrentChange"
          />
        </el-col>
      </el-row>
    </div>

    <user-info-dialog
      v-if="showUserInfoDialog"
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
  getUserSearcher,
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
      let result = await getUserSearcher({
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
.el-header {
  .header-main {
    line-height: 70px;
    .user-settings {
      font-size: 28px;
    }
  }
}
.el-main {
  background-color: #fafbf6;
  .main-head {
    line-height: 80px;
    font-size: 32px;
  }
  .main-body {
    background-color: #ffffff;

    .main-tools {
      padding-bottom: 24px;
    }
  }
}
</style>
