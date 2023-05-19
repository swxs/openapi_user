<template>
  <div class="common-layout">
    <el-container class="main-box">
      <el-aside width="200px"> </el-aside>
      <el-container>
        <el-header>
          <el-row class="mb-4 header-main">
            <el-col :span="1" :offset="23">
              <el-dropdown trigger="hover">
                <span class="el-dropdown-link">
                  <i class="el-icon-user user-settings"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item :disabled="true">{{
                    currentUser.username
                  }}</el-dropdown-item>
                  <el-dropdown-item>
                    <span @click.prevent="showDialog(currentUser)"
                      >修改信息</span
                    ></el-dropdown-item
                  >
                  <el-dropdown-item>
                    <span @click.prevent="logout()"
                      >登&emsp;&emsp;出</span
                    ></el-dropdown-item
                  >
                </el-dropdown-menu>
              </el-dropdown>
            </el-col>
          </el-row>
        </el-header>
        <el-main>
          <el-row class="mb-4 main-head">
            全部用户
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
        </el-main>
      </el-container>
    </el-container>

    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="80%">
      <el-form :model="form">
        <el-form-item label="用户名" :label-width="formLabelWidth">
          <el-input v-model="form.username" autocomplete="off"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="createOrUpdateUser()"
          >确 定</el-button
        >
        <el-button type="danger" @click="closeDialog()">取 消</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {
  searchUser,
  selectUser,
  createUser,
  updateUser,
  deleteUser,
} from '../api/User.js'
import { getTokenInfo } from '../utils/auth'
import { getDateFormat } from '../utils/dateUtils'

export default {
  name: 'home',
  data() {
    return {
      currentUser: {
        username: '',
      },
      tableData: [],
      changing: null,
      dialogVisible: false,
      dialogTitle: '新增用户',
      formLabelWidth: '100px',
      form: {
        username: null,
        nickname: null,
      },
      multipleSelection: [],
      currentPage: 1,
      total: 10,
    }
  },
  computed: {},
  components: {},
  created() {},
  async mounted() {
    // 数据表格
    this.handleCurrentChange(1)
    // 当前用户
    let tokenInfo = getTokenInfo()
    let data = await selectUser(tokenInfo.user_id)
    this.currentUser = data.data.data
  },
  methods: {
    formatDate(date) {
      return getDateFormat(date)
    },
    async showDialog(user) {
      console.log(user)
      if (user) {
        this.changing = user
        this.dialogTitle = '更新用户'
        this.form.username = user.username
      } else {
        this.changing = null
        this.dialogTitle = '新增用户'
      }
      this.dialogVisible = true
    },
    async createOrUpdateUser() {
      if (this.changing) {
        let data = {
          username: this.form.username,
        }
        const user = await updateUser(this.changing.id, data)
      } else {
        let data = {
          username: this.form.username,
        }
        const user = await createUser(data)
      }
      await this.handleCurrentChange(this.currentPage)
      await this.closeDialog()
    },
    async closeDialog() {
      this.changing = null
      this.form.username = null
      this.dialogVisible = false
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
    async logout() {
      window.postMessage(
        {
          cmd: 'logout',
          params: {},
        },
        '*'
      )
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.main-box {
  height: 100%;
  position: absolute;
}

.el-aside {
  background-color: #000000;
}

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
