import axios from '../plugins/axios'

const OAuthClientUrl = '/api/system/oauth_client/'

export async function searchOAuthClient(params) {
  return axios.get(OAuthClientUrl, { params })
}

export async function createOAuthClient(data) {
  return axios.post(OAuthClientUrl, data)
}
