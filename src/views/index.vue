<template>
  <div class="common-layout">
    <a-layout class="main-box openapi-shell">
      <a-layout-sider width="244" class="ou-sider">
        <div class="ou-brand">
          <span class="ou-brand__mark">API</span>
          <div class="ou-brand__text">
            <span class="ou-brand__title">Open</span>
            <span class="ou-brand__sub">用户控制台</span>
          </div>
        </div>
        <a-menu
          v-model:selectedKeys="selectedKeys"
          theme="dark"
          mode="inline"
        >
          <a-menu-item
            v-for="item in menuList"
            :key="item.name"
            @click="go(item.name)"
          >
            <component :is="iconMap[item.icon]" class="ou-menu-icon" />
            <span>{{ item.title }}</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout>
        <a-layout-header class="ou-header">
          <div class="ou-header__inner">
            <div class="ou-header__lead">
              <div class="ou-header__rail" aria-hidden="true" />
              <h1 class="ou-header__crumb">{{ currentSectionTitle }}</h1>
            </div>
            <div class="ou-header__actions">
              <a-dropdown trigger="click" placement="bottomRight" :arrow="{ pointAtCenter: true }">
                <button type="button" class="ou-user-trigger" aria-label="用户菜单">
                  <span class="ou-user-trigger__avatar" aria-hidden="true">
                    {{ userInitial }}
                  </span>
                  <span class="ou-user-trigger__name">{{ currentUser.username || '—' }}</span>
                  <span class="ou-user-trigger__chev" aria-hidden="true">▾</span>
                </button>
                <template #overlay>
                  <a-menu class="ou-user-menu">
                    <a-menu-item :disabled="true" class="ou-user-menu__id">
                      {{ currentUser.username }}
                    </a-menu-item>
                    <a-menu-item @click="showUserInfo">个人信息</a-menu-item>
                    <a-menu-item @click="logout()">登出</a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </div>
          </div>
        </a-layout-header>
        <a-layout-content class="openapi-layout__content">
          <router-view />
        </a-layout-content>
      </a-layout>
    </a-layout>

    <user-info-dialog
      :visible="showUserInfoDialog"
      :editData="currentUser"
      :type="'view'"
      @close-dialog="closeUserInfoDialog"
    />
  </div>
</template>

<script>
import { selectUser } from '../api/User.js'
import { getTokenInfo } from '../utils/auth'
import { UserOutlined, FileTextOutlined, AppstoreOutlined, ApiOutlined } from '@ant-design/icons-vue'
import userInfoDialog from '../components/user-info-dialog'

export default {
  name: 'home',
  components: {
    UserOutlined,
    FileTextOutlined,
    AppstoreOutlined,
    ApiOutlined,
    'user-info-dialog': userInfoDialog,
  },
  data() {
    return {
      currentUser: {
        username: '',
      },
      showUserInfoDialog: false,
      menuList: [
        { name: 'apps', icon: 'apps', title: '应用管理' },
        { name: 'user', icon: 'user', title: '用户管理' },
        { name: 'file', icon: 'file', title: '文件管理' },
        { name: 'sudoku', icon: 'sudoku', title: '数独谜题' },
      ],
      defaultMenu: 'user',
      selectedKeys: ['user'],
    }
  },
  computed: {
    iconMap() {
      return {
        apps: ApiOutlined,
        user: UserOutlined,
        file: FileTextOutlined,
        sudoku: AppstoreOutlined,
      }
    },
    currentSectionTitle() {
      const m = this.menuList.find((x) => x.name === this.selectedKeys[0])
      return m ? m.title : '控制台'
    },
    userInitial() {
      const u = this.currentUser.username
      if (!u || typeof u !== 'string') return '?'
      return u.trim().charAt(0).toUpperCase()
    },
  },
  watch: {
    $route: {
      immediate: true,
      handler(to) {
        const name = to.name
        if (name && ['apps', 'user', 'file', 'sudoku'].includes(name)) {
          this.selectedKeys = [name]
        }
      },
    },
  },
  async mounted() {
    await this.go(this.defaultMenu)
    const tokenInfo = getTokenInfo()
    const data = await selectUser(tokenInfo.user_id)
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
    async logout() {},
  },
}
</script>

<style lang="less" scoped>
.main-box {
  width: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.ou-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
}

.ou-menu-icon {
  margin-right: 10px;
  font-size: 16px;
  vertical-align: -0.125em;
}

.ou-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  max-width: 100%;
  min-height: 0;
}

.ou-header__lead {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.ou-header__rail {
  width: 4px;
  height: 24px;
  border-radius: 2px;
  background: linear-gradient(180deg, #c9722e, #1f8a7a);
  flex-shrink: 0;
}

.ou-header__crumb {
  margin: 0;
  font-family: var(--ou-font-display, 'Unbounded', sans-serif);
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--ou-ink, #0c0f14);
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ou-header__actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* 避免 Dropdown 包裹层把触发器撑高 */
.ou-header__actions :deep(.ant-dropdown-trigger) {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.ou-user-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 4px;
  max-height: 36px;
  border-radius: 999px;
  border: 1px solid var(--ou-border, rgba(12, 15, 20, 0.09));
  background: var(--ou-surface, #faf7f2);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  color: var(--ou-ink, #0c0f14);
  line-height: 1.2;
  vertical-align: middle;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.2s ease;
}

.ou-user-trigger:hover {
  border-color: rgba(201, 114, 46, 0.35);
  box-shadow: 0 4px 16px rgba(10, 14, 18, 0.06);
}

.ou-user-trigger:focus-visible {
  outline: 2px solid #c9722e;
  outline-offset: 2px;
}

.ou-user-trigger__avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c9722e, #e8a05c);
  color: #fff;
  font-family: var(--ou-font-display, sans-serif);
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ou-user-trigger__name {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 500;
}

.ou-user-trigger__chev {
  font-size: 9px;
  color: var(--ou-ink-muted, #5c6575);
  opacity: 0.8;
}
</style>

<style lang="less">
/* Dropdown menu polish (unscoped: teleported overlay) */
.ou-user-menu.ant-dropdown-menu {
  border-radius: 12px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(10, 14, 18, 0.12);
  border: 1px solid rgba(12, 15, 20, 0.08);
}

.ou-user-menu .ant-dropdown-menu-item {
  border-radius: 8px;
}

.ou-user-menu__id.ant-dropdown-menu-item-disabled {
  opacity: 0.85;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.75) !important;
}
</style>
