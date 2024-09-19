<template>
  <div class="common-layout">
    <el-container class="main-box">
      <el-aside width="200px">
        <el-menu
          :default-active="defaultMenu"
          class="el-menu-vertical-demo"
          background-color="#000000"
          text-color="#ffffff"
        >
          <el-menu-item
            v-for="item in menuList"
            :key="item.name"
            :index="item.name"
            @click="go(item.name)"
          >
            <i :class="item.icon"></i>
            <span slot="title">{{ item.title }}</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
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
          <router-view></router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
import { selectUser } from '../api/User.js'
import { getTokenInfo } from '../utils/auth'

export default {
  name: 'home',
  data() {
    return {
      currentUser: {
        username: '',
      },
      showUserInfoDialog: false,
      menuList: [
        {
          name: 'user',
          icon: 'el-icon-user',
          title: '用户管理',
        },
        {
          name: 'file',
          icon: 'el-icon-files',
          title: '文件管理',
        },
      ],
      defaultMenu: 'user',
    }
  },
  computed: {},
  components: {},
  created() {},
  async mounted() {
    // 默认为用户管理页面
    await this.go(this.defaultMenu)

    // 当前用户
    let tokenInfo = getTokenInfo()
    let data = await selectUser(tokenInfo.user_id)
    this.currentUser = data.data.data
  },
  methods: {
    async go(target) {
      this.$router.push(`/${target}`)
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
  width: 100%;
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
