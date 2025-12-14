/**
 * OAuth2.0 客户端工具函数
 */

import { setToken, setRefreshToken, getToken } from './auth'

// OAuth配置（从环境变量读取）
const OAUTH_CONFIG = {
  authorizationServer: process.env.VUE_APP_OAUTH_SERVER_URL || 'http://127.0.0.1:8090',
  clientId: process.env.VUE_APP_OAUTH_CLIENT_ID || '',
  redirectUri: process.env.VUE_APP_OAUTH_REDIRECT_URI || window.location.origin + '/oauth/callback',
  scope: process.env.VUE_APP_OAUTH_SCOPE || 'read write',
}

// 存储state的key
const OAUTH_STATE_KEY = 'oauth_state'
const OAUTH_REDIRECT_KEY = 'oauth_redirect_uri'
// State过期时间（毫秒），30秒
const OAUTH_STATE_EXPIRES_MS = 30 * 1000

/**
 * 生成随机state参数（用于CSRF防护）
 */
export function generateState() {
  const array = new Uint32Array(1)
  window.crypto.getRandomValues(array)
  return array[0].toString(36) + Date.now().toString(36)
}

/**
 * 保存state到localStorage（带过期时间）
 */
export function saveState(state) {
  try {
    const expires = Date.now() + OAUTH_STATE_EXPIRES_MS
    const stateData = {
      value: state,
      expires: expires,
    }
    const stateJson = JSON.stringify(stateData)
    localStorage.setItem(OAUTH_STATE_KEY, stateJson)
    console.log('[OAuth] State已保存到localStorage:', {
      state: state,
      expires: new Date(expires).toISOString(),
      expiresIn: OAUTH_STATE_EXPIRES_MS / 1000 + '秒',
    })
    
    // 验证保存是否成功
    const saved = localStorage.getItem(OAUTH_STATE_KEY)
    if (saved !== stateJson) {
      console.error('[OAuth] State保存验证失败！', { expected: stateJson, saved })
    } else {
      console.log('[OAuth] State保存验证成功')
    }
  } catch (e) {
    console.error('[OAuth] 保存state到localStorage失败:', e)
    throw e
  }
}

/**
 * 获取state（不删除，用于验证），如果过期则自动清除
 */
export function getState() {
  try {
    const stateJson = localStorage.getItem(OAUTH_STATE_KEY)
    if (!stateJson) {
      console.log('[OAuth] 从localStorage获取state（不删除）: null')
      return null
    }
    
    // 解析存储的数据
    let stateData
    try {
      stateData = JSON.parse(stateJson)
    } catch (e) {
      // 兼容旧格式（直接存储字符串的情况）
      console.warn('[OAuth] State格式为旧格式，自动清除:', stateJson)
      localStorage.removeItem(OAUTH_STATE_KEY)
      return null
    }
    
    // 检查是否过期
    const now = Date.now()
    if (now > stateData.expires) {
      console.warn('[OAuth] State已过期，自动清除:', {
        state: stateData.value,
        expires: new Date(stateData.expires).toISOString(),
        now: new Date(now).toISOString(),
        expiredBy: Math.round((now - stateData.expires) / 1000) + '秒',
      })
      localStorage.removeItem(OAUTH_STATE_KEY)
      return null
    }
    
    // 计算剩余时间
    const remaining = Math.round((stateData.expires - now) / 1000)
    console.log('[OAuth] 从localStorage获取state（不删除）:', {
      state: stateData.value,
      expires: new Date(stateData.expires).toISOString(),
      remaining: remaining + '秒',
    })
    
    return stateData.value
  } catch (e) {
    console.error('[OAuth] 获取state失败:', e)
    // 出错时清除可能损坏的数据
    localStorage.removeItem(OAUTH_STATE_KEY)
    return null
  }
}

/**
 * 清除state
 */
export function clearState() {
  try {
    const stateJson = localStorage.getItem(OAUTH_STATE_KEY)
    if (stateJson) {
      // 尝试解析以获取实际的 state 值用于日志
      let stateValue = null
      try {
        const stateData = JSON.parse(stateJson)
        stateValue = stateData.value
      } catch (e) {
        // 如果是旧格式，直接使用原始值
        stateValue = stateJson
      }
      
      localStorage.removeItem(OAUTH_STATE_KEY)
      console.log('[OAuth] State已从localStorage清除:', stateValue)
    } else {
      console.warn('[OAuth] State不存在于localStorage，无法清除')
    }
  } catch (e) {
    console.error('[OAuth] 清除state失败:', e)
    // 即使出错也尝试清除
    try {
      localStorage.removeItem(OAUTH_STATE_KEY)
    } catch (e2) {
      console.error('[OAuth] 强制清除state也失败:', e2)
    }
  }
}

/**
 * 保存重定向前的URL
 */
export function saveRedirectUri(uri) {
  localStorage.setItem(OAUTH_REDIRECT_KEY, uri)
  console.log('[OAuth] 重定向URI已保存到localStorage:', uri)
}

/**
 * 获取并清除重定向前的URL
 */
export function getAndClearRedirectUri() {
  const uri = localStorage.getItem(OAUTH_REDIRECT_KEY)
  console.log('[OAuth] 从localStorage获取重定向URI:', uri)
  if (uri) {
    localStorage.removeItem(OAUTH_REDIRECT_KEY)
    console.log('[OAuth] 重定向URI已从localStorage清除')
  }
  return uri || '/'
}

/**
 * 构建授权URL
 * @param {string} state - 状态参数
 * @returns {string} 授权URL
 */
export function buildAuthorizationUrl(state) {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: OAUTH_CONFIG.scope,
    state: state,
  })
  return `${OAUTH_CONFIG.authorizationServer}/api/oauth/authorize?${params.toString()}`
}

/**
 * 重定向到授权服务器
 * @param {string} currentPath - 当前路径（用于授权后重定向回来）
 */
export function redirectToAuthorization(currentPath = window.location.pathname) {
  console.log('[OAuth] redirectToAuthorization 开始，当前路径:', currentPath)
  const currentState = getState()
  console.log('[OAuth] 当前localStorage状态:', {
    hasState: !!currentState,
    state: currentState,
    hasRedirectUri: !!localStorage.getItem(OAUTH_REDIRECT_KEY),
    allKeys: Object.keys(localStorage).filter(k => k.includes('oauth') || k.includes('state')),
  })
  
  // 保存当前路径
  saveRedirectUri(currentPath)
  console.log('[OAuth] 已保存重定向URI:', currentPath)
  
  // 生成state
  const state = generateState()
  console.log('[OAuth] 生成state:', state)
  saveState(state)
  console.log('[OAuth] 已生成并保存state:', state)
  
  // 再次验证state是否保存成功
  const verifyState = getState()
  console.log('[OAuth] State保存后验证:', { 
    expected: state, 
    saved: verifyState, 
    match: verifyState === state,
    localStorageKeys: Object.keys(localStorage),
  })
  
  if (verifyState !== state) {
    console.error('[OAuth] State保存验证失败！无法继续重定向')
    return
  }
  
  // 构建授权URL并重定向
  const authUrl = buildAuthorizationUrl(state)
  console.log('[OAuth] 构建授权URL:', authUrl)
  console.log('[OAuth] 准备重定向到授权服务器')
  console.log('[OAuth] 重定向前最终localStorage状态:', {
    state: localStorage.getItem(OAUTH_STATE_KEY),
    redirectUri: localStorage.getItem(OAUTH_REDIRECT_KEY),
  })
  window.location.href = authUrl
}

// 防止重复请求的标记
let isExchangingToken = false

/**
 * 处理OAuth回调
 * @param {string} code - 授权码
 * @param {string} state - 状态参数
 * @returns {Promise<boolean>} 是否成功
 */
export async function handleOAuthCallback(code, state) {
  console.log('[OAuth] handleOAuthCallback 开始，code长度:', code ? code.length : 0, 'state:', state)
  
  // 防止重复请求
  if (isExchangingToken) {
    console.warn('[OAuth] Token交换正在进行中，忽略重复请求')
    return false
  }
  
  // 获取保存的state（不删除），用于验证
  const savedState = getState()
  console.log('[OAuth] State验证前检查:', { 
    savedState: savedState, 
    receivedState: state, 
    match: savedState === state,
    localStorageKeys: Object.keys(localStorage).filter(k => k.includes('oauth') || k.includes('state')),
  })
  
  // 验证state（不删除）
  if (!savedState || savedState !== state) {
    console.error('[OAuth] State验证失败:', { 
      savedState, 
      receivedState: state,
      allLocalStorageKeys: Object.keys(localStorage),
    })
    // State验证失败时清除state，避免重复验证
    clearState()
    return false
  }
  
  console.log('[OAuth] State验证通过:', { savedState, receivedState: state })

  // 设置标记，防止重复请求
  isExchangingToken = true
  
  try {
    console.log('[OAuth] 开始用授权码换取token')
    // 用授权码换取token
    const tokenResponse = await exchangeCodeForToken(code)
    console.log('[OAuth] Token响应:', {
      hasAccessToken: !!(tokenResponse && tokenResponse.access_token),
      hasRefreshToken: !!(tokenResponse && tokenResponse.refresh_token),
      tokenType: tokenResponse && tokenResponse.token_type,
    })
    
    if (tokenResponse && tokenResponse.access_token) {
      console.log('[OAuth] 开始保存token')
      // 保存token
      setToken(tokenResponse.access_token)
      console.log('[OAuth] Access token已保存，长度:', tokenResponse.access_token.length)
      
      if (tokenResponse.refresh_token) {
        setRefreshToken(tokenResponse.refresh_token)
        console.log('[OAuth] Refresh token已保存，长度:', tokenResponse.refresh_token.length)
      }
      
      // 验证token是否已保存
      const savedToken = getToken()
      console.log('[OAuth] Token保存验证:', { saved: !!savedToken, length: savedToken ? savedToken.length : 0 })
      
      // Token获取成功后，清除state
      clearState()
      console.log('[OAuth] Token获取成功，已清除state')
      
      isExchangingToken = false
      return true
    }
    console.error('[OAuth] Token响应中没有access_token')
    isExchangingToken = false
    // 清除state，避免重复尝试
    clearState()
    return false
  } catch (error) {
    console.error('[OAuth] OAuth回调处理失败:', error)
    // 清除标记和state，允许重试
    isExchangingToken = false
    clearState()
    // 重新抛出错误，让调用者知道具体错误信息
    throw error
  }
}

/**
 * 用授权码换取token
 * @param {string} code - 授权码
 * @returns {Promise<Object>} token响应
 */
async function exchangeCodeForToken(code) {
  console.log('[OAuth] exchangeCodeForToken 开始')
  console.log('[OAuth] 配置:', {
    authorizationServer: OAUTH_CONFIG.authorizationServer,
    clientId: OAUTH_CONFIG.clientId,
    redirectUri: OAUTH_CONFIG.redirectUri,
    hasClientSecret: !!process.env.VUE_APP_OAUTH_CLIENT_SECRET,
  })
  
  const formData = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    client_id: OAUTH_CONFIG.clientId,
    client_secret: process.env.VUE_APP_OAUTH_CLIENT_SECRET || '', // 注意：在生产环境中，客户端密钥不应该暴露在前端
  })

  const tokenUrl = `${OAUTH_CONFIG.authorizationServer}/api/oauth/token`
  console.log('[OAuth] 请求URL:', tokenUrl)
  console.log('[OAuth] 请求参数:', {
    grant_type: 'authorization_code',
    code: code.substring(0, 20) + '...',
    redirect_uri: OAUTH_CONFIG.redirectUri,
    client_id: OAUTH_CONFIG.clientId,
  })

  let response
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
      // 如果需要携带凭证，取消注释下面这行
      // credentials: 'include',
    })
  } catch (fetchError) {
    // 捕获网络错误（包括 CORS 错误）
    console.error('[OAuth] Fetch 请求失败:', fetchError)
    const errorMessage = fetchError.message || '网络请求失败'
    // 检查是否是 CORS 错误
    if (errorMessage.includes('CORS') || errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      throw new Error(`CORS错误: 无法连接到授权服务器。请检查服务器CORS配置是否允许来自 ${window.location.origin} 的请求。原始错误: ${errorMessage}`)
    }
    throw new Error(`网络错误: ${errorMessage}`)
  }

  console.log('[OAuth] 响应状态:', response.status, response.statusText)

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
      console.error('[OAuth] 错误响应:', errorData)
    } catch (e) {
      const text = await response.text()
      console.error('[OAuth] 错误响应（非JSON）:', text)
      throw new Error(`HTTP ${response.status}: ${text || '获取token失败'}`)
    }
    throw new Error(errorData.message || errorData.error_description || errorData.error || '获取token失败')
  }

  let result
  try {
    result = await response.json()
    console.log('[OAuth] Token获取成功:', {
      hasAccessToken: !!result.access_token,
      hasRefreshToken: !!result.refresh_token,
      tokenType: result.token_type,
      expiresIn: result.expires_in,
    })
  } catch (parseError) {
    console.error('[OAuth] 解析响应JSON失败:', parseError)
    throw new Error('服务器响应格式错误，无法解析JSON')
  }
  
  return result
}

/**
 * 使用refresh_token刷新access_token
 * @param {string} refreshToken - 刷新令牌
 * @returns {Promise<Object>} token响应
 */
export async function refreshAccessToken(refreshToken) {
  console.log('[OAuth] refreshAccessToken 开始，refreshToken长度:', refreshToken ? refreshToken.length : 0)
  
  const formData = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAUTH_CONFIG.clientId,
    client_secret: process.env.VUE_APP_OAUTH_CLIENT_SECRET || '',
  })

  const tokenUrl = `${OAUTH_CONFIG.authorizationServer}/api/oauth/token`
  console.log('[OAuth] 刷新token请求URL:', tokenUrl)

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  console.log('[OAuth] 刷新token响应状态:', response.status, response.statusText)

  if (!response.ok) {
    let errorData
    try {
      errorData = await response.json()
      console.error('[OAuth] 刷新token错误响应:', errorData)
    } catch (e) {
      const text = await response.text()
      console.error('[OAuth] 刷新token错误响应（非JSON）:', text)
      throw new Error(`HTTP ${response.status}: ${text || '刷新token失败'}`)
    }
    throw new Error(errorData.message || errorData.error_description || errorData.error || '刷新token失败')
  }

  const tokenResponse = await response.json()
  console.log('[OAuth] Token刷新成功:', {
    hasAccessToken: !!tokenResponse.access_token,
    hasRefreshToken: !!tokenResponse.refresh_token,
  })
  
  // 更新token
  setToken(tokenResponse.access_token)
  console.log('[OAuth] 新access token已保存')
  
  if (tokenResponse.refresh_token) {
    setRefreshToken(tokenResponse.refresh_token)
    console.log('[OAuth] 新refresh token已保存')
  }
  
  return tokenResponse
}

/**
 * 检查URL中是否包含OAuth回调参数
 * @returns {Object|null} 包含code和state的对象，或null
 */
export function parseOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const error = urlParams.get('error')
  const errorDescription = urlParams.get('error_description')

  if (error) {
    return { error, errorDescription }
  }

  if (code && state) {
    return { code, state }
  }

  return null
}
