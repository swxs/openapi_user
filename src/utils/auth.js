const TokenKey = 'home_token'

export function getToken() {
  let token = sessionStorage.getItem(TokenKey)
  if (!token) {
    return null
  }
  let data = base2obj(token)
  if (data.exp * 1000 > new Date().valueOf()) {
    return token
  } else {
    sessionStorage.removeItem(TokenKey)
    return null
  }
}

export function getTokenInfo() {
  let token = sessionStorage.getItem(TokenKey)
  if (!token) {
    return {}
  }
  let data = base2obj(token)
  if (data.exp * 1000 > new Date().valueOf()) {
    return data
  } else {
    sessionStorage.removeItem(TokenKey)
    return {}
  }
}

export function setToken(token) {
  sessionStorage.setItem(TokenKey, token)
}

export function removeToken() {
  sessionStorage.removeItem(TokenKey)
}

export function base2obj(str) {
  let baseStr = str.split('.')[1]
  if (!baseStr) {
    return {}
  }
  return JSON.parse(window.atob(baseStr))
}

export const requests = []

export function cleanRequests(token) {
  while (requests.length) {
    requests.shift()(token)
  }
}
