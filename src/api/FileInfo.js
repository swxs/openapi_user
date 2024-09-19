import Vue from 'vue'

const UploadUrl = '/api/upload/upload/'
const UploadPathUrl = '/api/upload/upload/path/'
const FileInfoUrl = '/api/upload/file_info/'

export async function searchFileInfo(data) {
  return Vue.axios.get(`${FileInfoUrl}`, { params: data })
}

export async function getPathInfo(id) {
  return Vue.axios.get(`${UploadPathUrl}${id}`)
}
