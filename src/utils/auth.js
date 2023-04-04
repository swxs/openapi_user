const TokenKey = 'home_token'
const RefreshTokenKey = 'home_refreshToken'

export function getToken() {
  let token = localStorage.getItem(TokenKey)
  if (!token) {
    return null
  }
  let data = base2obj(token)
  if (data.exp * 1000 > new Date().valueOf()) {
    return token
  } else {
    localStorage.removeItem(TokenKey)
    return null
  }
}

export function getTokenInfo() {
  let token = localStorage.getItem(TokenKey)
  if (!token) {
    return {}
  }
  let data = base2obj(token)
  if (data.exp * 1000 > new Date().valueOf()) {
    return data
  } else {
    localStorage.removeItem(TokenKey)
    return {}
  }
}

export function getRefreshToken() {
  let refreshToken = localStorage.getItem(RefreshTokenKey)
  if (!refreshToken) {
    return null
  }
  let data = base2obj(refreshToken)
  if (data.exp * 1000 > new Date().valueOf()) {
    return refreshToken
  } else {
    localStorage.removeItem(RefreshTokenKey)
    return null
  }
}

export function setToken(token) {
  localStorage.setItem(TokenKey, token)
}

export function setRefreshToken(token) {
  localStorage.setItem(RefreshTokenKey, token)
}

export function removeToken() {
  localStorage.removeItem(TokenKey)
}

export function removeRefreshToken() {
  localStorage.removeItem(RefreshTokenKey)
}

export function base2obj(str) {
  let baseStr = str.split('.')[1]
  if (!baseStr) {
    return {}
  }
  return JSON.parse(window.atob(baseStr))
}
