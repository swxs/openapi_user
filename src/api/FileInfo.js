import axios from '../plugins/axios'

const UploadUrl = '/api/upload/upload/'
const UploadPathUrl = '/api/upload/upload/path/'
const FileInfoUrl = '/api/upload/file_info/'

export async function searchFileInfo(data) {
  return axios.get(`${FileInfoUrl}`, { params: data })
}

export async function getPathInfo(id) {
  return axios.get(`${UploadPathUrl}${id}`)
}
