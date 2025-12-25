<template>
  <div class="common-layout">
    <a-layout class="main-box">
      <a-layout-sider width="200px">
        <a-menu
          v-model:selectedKeys="selectedKeys"
          theme="dark"
        >
          <a-menu-item
            v-for="item in menuList"
            :key="item.name"
            @click="go(item.name)"
          >
            <component :is="iconMap[item.icon]" style="margin-right: 8px; font-size: 14px" />
            <span>{{ item.title }}</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header>
          <a-row class="mb-4 header-main">
            <a-col :span="1" :offset="23">
              <a-dropdown trigger="click" placement="bottomRight" :arrow="{ pointAtCenter: true }">
                <span class="user-dropdown-link">
                  <a-tooltip title="用户菜单" placement="bottom">
                    <UserOutlined class="user-settings" style="font-size: 28px; padding: 8px;" />
                  </a-tooltip>
                </span>
                <template #overlay>
                  <a-menu>
                    <a-menu-item :disabled="true">{{
                      currentUser.username
                    }}</a-menu-item>
                    <a-menu-item @click="showUserInfo">
                      个人信息
                    </a-menu-item>
                    <a-menu-item @click="logout()">
                      登&emsp;&emsp;出
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-col>
          </a-row>
        </a-layout-header>
        <a-layout-content>
          <router-view></router-view>
        </a-layout-content>
      </a-layout>
    </a-layout>
    
    <user-info-dialog
      :visible="showUserInfoDialog"
      :editData="currentUser"
      :type="'view'"
      @close-dialog="closeUserInfoDialog"
    ></user-info-dialog>
  </div>
</template>

<script>
import { selectUser } from '../api/User.js'
import { getTokenInfo } from '../utils/auth'
import { UserOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import userInfoDialog from '../components/user-info-dialog'

export default {
  name: 'home',
  components: {
    UserOutlined,
    FileTextOutlined,
    'user-info-dialog': userInfoDialog,
  },
  data() {
    return {
      currentUser: {
        username: '',
      },
      showUserInfoDialog: false,
      menuList: [
        {
          name: 'user',
          icon: 'user',
          title: '用户管理',
        },
        {
          name: 'file',
          icon: 'file',
          title: '文件管理',
        },
      ],
      defaultMenu: 'user',
      selectedKeys: ['user'],
    }
  },
  computed: {
    iconMap() {
      return {
        user: UserOutlined,
        file: FileTextOutlined,
      }
    },
  },
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
      this.selectedKeys = [target]
      this.$router.push(`/${target}`)
    },
    showUserInfo() {
      this.showUserInfoDialog = true
    },
    closeUserInfoDialog() {
      this.showUserInfoDialog = false
    },
    async logout() {
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
.main-box {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.main-box .ant-layout-sider {
  background-color: #000000;
}

.main-box .ant-layout-header {
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  .header-main {
    line-height: 64px;
    .user-dropdown-link {
      cursor: pointer;
      color: inherit;
      display: inline-flex;
      align-items: center;
      transition: color 0.3s;
      &:hover {
        color: #1890ff;
      }
    }
    .user-settings {
      font-size: 24px;
    }
  }
}
.main-box .ant-layout-content {
  background-color: #f0f2f5;
  padding: 24px;
  overflow-y: auto;
  overflow-x: hidden;
  height: calc(100vh - 64px);
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

    .main-tools {
      padding-top: 16px;
      padding-bottom: 24px;
    }
  }
}
</style>
