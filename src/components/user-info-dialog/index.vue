<template>
  <el-dialog
    class="user-info-dialog"
    :visible="show"
    :title="dialogTitle"
    width="80%"
    @close="close"
  >
    <el-form :model="form">
      <el-form-item label="用户名" :label-width="formLabelWidth">
        <el-input v-model="form.username" autocomplete="off"></el-input>
      </el-form-item>
    </el-form>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" @click="createOrUpdateUser">确 定</el-button>
      <el-button type="danger" @click="close">取 消</el-button>
    </span>
  </el-dialog>
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
      dialogTitle: this.type === 'create' ? '新增用户' : '更新用户',
      changing: null,
      form: {
        username: null,
        nickname: null,
      },
      formLabelWidth: '100px',
    }
  },
  watch: {},
  computed: {
    show() {
      return this.visible
    },
  },
  components: {},
  created() {},
  async mounted() {
    if (this.type === 'update') {
      this.changing = this.editData
      this.form = {
        username: this.editData.username,
        nickname: this.editData.nickname,
      }
    } else {
      this.changing = null
      this.form = {
        username: '',
        nickname: '',
      }
    }
  },
  methods: {
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
