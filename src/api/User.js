import axios from '../plugins/axios'

const UserUrl = '/api/system/user/'
const UserAuthUrl = '/api/system/user_auth/'
const UserSearcherUrl = '/api/system/searcher/'

export async function searchUser(data) {
  return axios.get(`${UserUrl}`, { params: data })
}

export async function selectUser(id) {
  return axios.get(`${UserUrl}${id}`)
}

export async function createUser(data) {
  return axios.post(`${UserUrl}`, data)
}

export async function copyUser(id, data) {
  return axios.post(`${UserUrl}${id}`, data)
}

export async function updateUser(id, data) {
  return axios.put(`${UserUrl}${id}`, data)
}

export async function deleteUser(id) {
  return axios.delete(`${UserUrl}${id}`)
}

export async function searchUserAuth(data) {
  return axios.get(`${UserAuthUrl}`, { params: data })
}

export async function selectUserAuth(id) {
  return axios.get(`${UserAuthUrl}${id}`)
}

export async function createUserAuth(data) {
  return axios.post(`${UserAuthUrl}`, data)
}

export async function copyUserAuth(id, data) {
  return axios.post(`${UserAuthUrl}${id}`, data)
}

export async function updateUserAuth(id, data) {
  return axios.put(`${UserAuthUrl}${id}`, data)
}

export async function deleteUserAuth(id) {
  return axios.delete(`${UserAuthUrl}${id}`)
}

export async function getUserSearcher(id) {
  return axios.get(`${UserSearcherUrl}self`)
}
