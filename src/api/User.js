import Vue from 'vue'

const UserUrl = '/api/system/user/'
const UserAuthUrl = '/api/system/user_auth/'
const UserSearcherUrl = '/api/system/searcher/'

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

export async function searchUserAuth(data) {
  return Vue.axios.get(`${UserAuthUrl}`, { params: data })
}

export async function selectUserAuth(id) {
  return Vue.axios.get(`${UserAuthUrl}${id}`)
}

export async function createUserAuth(data) {
  return Vue.axios.post(`${UserAuthUrl}`, data)
}

export async function copyUserAuth(id, data) {
  return Vue.axios.post(`${UserAuthUrl}${id}`, data)
}

export async function updateUserAuth(id, data) {
  return Vue.axios.put(`${UserAuthUrl}${id}`, data)
}

export async function deleteUserAuth(id) {
  return Vue.axios.delete(`${UserAuthUrl}${id}`)
}

export async function getUserSearcher(id) {
  return Vue.axios.get(`${UserSearcherUrl}self`)
}
