<template>
  <a-modal
    class="user-info-dialog"
    :open="visible"
    :title="dialogTitle"
    width="500px"
    @cancel="close"
  >
    <a-form :model="form" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
      <a-form-item label="用户名">
        <a-input 
          v-if="type !== 'view'"
          v-model:value="form.username" 
          autocomplete="off"
          placeholder="请输入用户名"
        ></a-input>
        <span v-else>{{ form.username || '-' }}</span>
      </a-form-item>
      <a-form-item label="昵称" v-if="form.nickname !== undefined">
        <a-input 
          v-if="type !== 'view'"
          v-model:value="form.nickname" 
          autocomplete="off"
          placeholder="请输入昵称"
        ></a-input>
        <span v-else>{{ form.nickname || '-' }}</span>
      </a-form-item>
      <a-form-item label="手机号" v-if="form.phone !== undefined">
        <a-input 
          v-if="type !== 'view'"
          v-model:value="form.phone" 
          autocomplete="off"
          placeholder="请输入手机号"
        ></a-input>
        <span v-else>{{ form.phone || '-' }}</span>
      </a-form-item>
      <a-form-item label="邮箱" v-if="form.email !== undefined">
        <a-input 
          v-if="type !== 'view'"
          v-model:value="form.email" 
          autocomplete="off"
          placeholder="请输入邮箱"
        ></a-input>
        <span v-else>{{ form.email || '-' }}</span>
      </a-form-item>
    </a-form>
    <template #footer>
      <a-button @click="close">{{ type === 'view' ? '关 闭' : '取 消' }}</a-button>
      <a-button v-if="type !== 'view'" type="primary" @click="createOrUpdateUser">确 定</a-button>
    </template>
  </a-modal>
</template>

<script>
import { createUser, updateUser } from '@/api/User.js'

export default {
  name: 'user-info-dialog',
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    editData: {
      type: Object,
      default: () => {},
    },
    type: {
      type: String,
      default: 'create',
    },
  },
  data() {
    return {
      changing: null,
      form: {
        username: null,
        nickname: null,
        phone: null,
        email: null,
      },
    }
  },
  computed: {
    dialogTitle() {
      if (this.type === 'view') return '个人信息'
      return this.type === 'create' ? '新增用户' : '更新用户'
    },
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.initForm()
      }
    },
    editData: {
      immediate: true,
      handler() {
        if (this.visible) {
          this.initForm()
        }
      },
    },
  },
  async mounted() {
    this.initForm()
  },
  methods: {
    initForm() {
      if (this.type === 'update' || this.type === 'view') {
        this.changing = this.editData
        this.form = {
          username: this.editData.username || '',
          nickname: this.editData.nickname || '',
          phone: this.editData.phone || '',
          email: this.editData.email || '',
        }
      } else {
        this.changing = null
        this.form = {
          username: '',
          nickname: '',
          phone: '',
          email: '',
        }
      }
    },
    async createOrUpdateUser() {
      if (this.changing) {
        let data = {
          username: this.form.username,
        }
        await updateUser(this.changing.id, data)
      } else {
        let data = {
          username: this.form.username,
        }
        await createUser(data)
      }
      this.$emit('close-dialog')
    },
    close() {
      this.$emit('close-dialog')
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped></style>
