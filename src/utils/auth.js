const TokenKey = 'home_token'
const RefreshTokenKey = 'home_refresh_token'

export function getToken() {
  let token = localStorage.getItem(TokenKey)
  console.log('[Auth] getToken:', { hasToken: !!token, tokenLength: token ? token.length : 0 })
  
  if (!token) {
    console.log('[Auth] 没有token')
    return null
  }
  
  try {
    let data = base2obj(token)
    console.log('[Auth] Token解析结果:', {
      hasExp: !!data.exp,
      exp: data.exp ? new Date(data.exp * 1000).toISOString() : 'N/A',
      now: new Date().toISOString(),
    })
    
    if (data.exp && data.exp * 1000 > new Date().valueOf()) {
      console.log('[Auth] Token有效')
      return token
    } else {
      console.log('[Auth] Token已过期，清除')
      localStorage.removeItem(TokenKey)
      return null
    }
  } catch (e) {
    console.error('[Auth] Token解析失败:', e)
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
  console.log('[Auth] getRefreshToken:', { hasRefreshToken: !!refreshToken, tokenLength: refreshToken ? refreshToken.length : 0 })
  
  if (!refreshToken) {
    console.log('[Auth] 没有refreshToken')
    return null
  }
  
  try {
    let data = base2obj(refreshToken)
    console.log('[Auth] RefreshToken解析结果:', {
      hasExp: !!data.exp,
      exp: data.exp ? new Date(data.exp * 1000).toISOString() : 'N/A',
      now: new Date().toISOString(),
    })
    
    if (data.exp && data.exp * 1000 > new Date().valueOf()) {
      console.log('[Auth] RefreshToken有效')
      return refreshToken
    } else {
      console.log('[Auth] RefreshToken已过期，清除')
      localStorage.removeItem(RefreshTokenKey)
      return null
    }
  } catch (e) {
    console.error('[Auth] RefreshToken解析失败:', e)
    return null
  }
}

export function setToken(token) {
  console.log('[Auth] setToken:', { hasToken: !!token, tokenLength: token ? token.length : 0 })
  if (token) {
    localStorage.setItem(TokenKey, token)
    console.log('[Auth] Token已保存到localStorage')
    
    // 验证是否保存成功
    const saved = localStorage.getItem(TokenKey)
    console.log('[Auth] Token保存验证:', { saved: !!saved, length: saved ? saved.length : 0 })
  } else {
    console.warn('[Auth] 尝试设置空token')
  }
}

export function setRefreshToken(token) {
  console.log('[Auth] setRefreshToken:', { hasToken: !!token, tokenLength: token ? token.length : 0 })
  if (token) {
    localStorage.setItem(RefreshTokenKey, token)
    console.log('[Auth] Refresh token已保存到localStorage')
  }
}

export function removeToken() {
  console.log('[Auth] removeToken: 清除所有token')
  localStorage.removeItem(TokenKey)
  localStorage.removeItem(RefreshTokenKey)
  console.log('[Auth] Token已清除')
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
