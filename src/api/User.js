import Vue from 'vue'

const UserUrl = '/api/system/user/'

export async function searchUser(data) {
  return Vue.axios.get(`${UserUrl}`, { params: data })
}

export async function selectUser(id) {
  return Vue.axios.get(`${UserUrl}${id}`)
}

export async function createUser(data) {
  return Vue.axios.post(`${UserUrl}`, data)
}

export async function copyUser(id, data) {
  return Vue.axios.post(`${UserUrl}${id}`, data)
}

export async function updateUser(id, data) {
  return Vue.axios.put(`${UserUrl}${id}`, data)
}

export async function deleteUser(id) {
  return Vue.axios.delete(`${UserUrl}${id}`)
}
