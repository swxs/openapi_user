'use strict'

import Vue from 'vue'
import axios from 'axios'
import { getToken, getRefreshToken, removeToken } from '../utils/auth'
import { refreshAccessToken, redirectToAuthorization } from '../utils/oauth'

let config = {}

const service = axios.create(config)

// 是否正在刷新token
let isRefreshing = false
// 等待刷新完成的请求队列
let refreshSubscribers = []

// 添加请求到等待队列
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb)
}

// 执行等待队列中的所有请求
function onRrefreshed(token) {
  refreshSubscribers.map(cb => cb(token))
  refreshSubscribers = []
}

service.interceptors.request.use(
  (config) => {
    if (config.method === 'get') {
      config.params = config.params || {}
      config.params._ = new Date().getTime()
    }

    // 排除OAuth token相关请求，避免拦截token获取请求
    const isOAuthTokenRequest = config.url && (
      config.url.includes('/api/oauth/token') ||
      config.url.includes('/api/oauth/authorize')
    )
    
    if (isOAuthTokenRequest) {
      console.log('[Axios] OAuth token请求，跳过token检查')
      return config
    }

    // 如果当前在OAuth回调路由，跳过token检查，等待OAuth流程完成
    const isOAuthCallbackPath = window.location.pathname === '/oauth/callback'
    const hasOAuthCallbackParams = window.location.search.includes('code=') || window.location.search.includes('error=')
    
    if (isOAuthCallbackPath || hasOAuthCallbackParams) {
      return new Promise(() => {
        // 这个Promise永远不会resolve，阻止请求继续
        // 当OAuth流程完成并重定向后，组件会重新加载，请求会重新发起
        console.log('[Axios] 请求被暂停，等待OAuth流程完成')
      })
    }

    const token = getToken()
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[Axios] 已添加Authorization header')
      return config
    } else {
      // 没有token，先检查是否有refresh_token
      const refreshToken = getRefreshToken()
      
      if (refreshToken) {
        // 有refresh_token，尝试刷新
        if (isRefreshing) {
          // 正在刷新中，将请求加入等待队列
          console.log('[Axios] Token正在刷新中，将请求加入等待队列')
          return new Promise((resolve) => {
            subscribeTokenRefresh((newToken) => {
              console.log('[Axios] 从等待队列中获取新token，继续请求')
              config.headers.Authorization = `Bearer ${newToken}`
              resolve(config)
            })
          })
        } else {
          // 开始刷新流程
          console.log('[Axios] 没有token但有refreshToken，开始刷新token')
          isRefreshing = true
          
          return new Promise((resolve, reject) => {
            refreshAccessToken(refreshToken)
              .then(() => {
                const newToken = getToken()
                if (newToken) {
                  console.log('[Axios] Token刷新成功，继续请求')
                  // 通知等待队列中的请求
                  onRrefreshed(newToken)
                  isRefreshing = false
                  // 继续当前请求
                  config.headers.Authorization = `Bearer ${newToken}`
                  resolve(config)
                } else {
                  // 刷新失败，清除token并重定向
                  console.error('[Axios] 刷新token后仍无法获取新token')
                  removeToken()
                  isRefreshing = false
                  const currentPath = window.location.pathname + window.location.search
                  redirectToAuthorization(currentPath)
                  reject(new Error('Token刷新失败'))
                }
              })
              .catch((refreshError) => {
                console.error('[Axios] 刷新token失败:', refreshError)
                removeToken()
                isRefreshing = false
                const currentPath = window.location.pathname + window.location.search
                redirectToAuthorization(currentPath)
                reject(refreshError)
              })
          })
        }
      } else {
        // 没有token也没有refreshToken，重定向到授权服务器
        console.log('[Axios] 没有token且没有refreshToken，准备重定向到授权服务器')
        const currentPath = window.location.pathname + window.location.search
        console.log('[Axios] 当前路径:', currentPath)
        redirectToAuthorization(currentPath)
        // 返回一个永远不会resolve的Promise，阻止请求继续
        return new Promise(() => {})
      }
    }
  },
  (error) => {
    console.error('[Axios] 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// Add a response interceptor
service.interceptors.response.use(
  (response) => {
    if (response.config.responseType == 'blob') {
      return Promise.resolve(response)
    } else {
      let data = response.data
      if (data.code === 0) {
        return Promise.resolve(data)
      } else {
        console.log('data: ', data)
        return Promise.resolve(data)
      }
    }
  },
  async (error) => {
    const originalRequest = error.config

    console.log('[Axios] 响应拦截器:', {
      url: originalRequest ? originalRequest.url : 'N/A',
      status: error.response ? error.response.status : 'N/A',
      isRetry: originalRequest ? originalRequest._retry : false,
      isRefreshing: isRefreshing,
    })

    // 如果是401错误，尝试刷新token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      console.log('[Axios] 检测到401错误，准备刷新token')
      
      if (isRefreshing) {
        // 如果正在刷新，将请求加入等待队列
        console.log('[Axios] Token正在刷新中，加入等待队列')
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            console.log('[Axios] 从等待队列中获取新token，重试请求')
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(service(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      console.log('[Axios] 开始刷新token流程')

      const refreshToken = getRefreshToken()
      console.log('[Axios] RefreshToken检查:', { hasRefreshToken: !!refreshToken })
      
      if (refreshToken) {
        try {
          console.log('[Axios] 尝试刷新token')
          // 尝试刷新token
          await refreshAccessToken(refreshToken)
          const newToken = getToken()
          console.log('[Axios] Token刷新成功，新token:', { hasToken: !!newToken })
          
          // 刷新成功，执行等待队列中的请求
          onRrefreshed(newToken)
          isRefreshing = false
          console.log('[Axios] 已通知等待队列中的请求')
          
          // 重试原始请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          console.log('[Axios] 重试原始请求:', originalRequest.url)
          return service(originalRequest)
        } catch (refreshError) {
          // 刷新失败，清除token并重定向到授权服务器
          console.error('[Axios] 刷新token失败:', refreshError)
          removeToken()
          isRefreshing = false
          
          const currentPath = window.location.pathname + window.location.search
          console.log('[Axios] 准备重定向到授权服务器，路径:', currentPath)
          redirectToAuthorization(currentPath)
          
          return Promise.reject(refreshError)
        }
      } else {
        // 没有refresh_token，重定向到授权服务器
        console.log('[Axios] 没有refreshToken，准备重定向到授权服务器')
        removeToken()
        isRefreshing = false
        
        const currentPath = window.location.pathname + window.location.search
        redirectToAuthorization(currentPath)
        
        return Promise.reject(error)
      }
    }

    // 其他错误正常处理
    if (error.response) {
      console.log('[Axios] 其他错误:', {
        status: error.response.status,
        data: error.response.data,
      })
      return Promise.resolve({
        status: error.response.status,
        ...error.response.data,
      })
    }
    
    console.error('[Axios] 未知错误:', error)
    return Promise.reject(error)
  }
)

Plugin.install = function(Vue, options) {
  Vue.axios = service
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return service
      },
    },
    $axios: {
      get() {
        return service
      },
    },
  })
}

Vue.use(Plugin)

export default Plugin
