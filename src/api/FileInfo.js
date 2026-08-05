import axios from '../plugins/axios'

const UploadUrl = '/api/upload/upload/'
const UploadPathUrl = '/api/upload/upload/path/'
const FileInfoUrl = '/api/upload/file_info/'
const ShareLinkUrl = '/api/upload/share_link/'

export async function searchFileInfo(data) {
  return axios.get(`${FileInfoUrl}`, { params: data })
}

export async function getPathInfo(id) {
  return axios.get(`${UploadPathUrl}${id}`)
}

export async function searchShareLink(data) {
  return axios.get(`${ShareLinkUrl}`, { params: data })
}

export async function createShareLink(data) {
  return axios.post(`${ShareLinkUrl}`, data)
}

export async function revokeShareLink(id) {
  return axios.put(`${ShareLinkUrl}${id}/revoke`)
}

export async function deleteShareLink(id) {
  return axios.delete(`${ShareLinkUrl}${id}`)
}
