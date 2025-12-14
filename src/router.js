import Vue from 'vue'
import Router from 'vue-router'
import Index from './views/index.vue'
import { getToken, getRefreshToken } from './utils/auth'
import { parseOAuthCallback, handleOAuthCallback, getAndClearRedirectUri, redirectToAuthorization } from './utils/oauth'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Index,
      meta: { requiresAuth: true },
      children: [
        {
          path: '/user',
          name: 'user',
          component: () => import('./views/user-view.vue'),
        },
        {
          path: '/file',
          name: 'file',
          component: () => import('./views/file-view.vue'),
        },
      ],
    },
    {
      path: '/download/:file_id',
      name: 'download',
      component: () => import('./views/download-view.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/oauth/callback',
      name: 'oauthCallback',
      beforeEnter: async (to, from, next) => {
        // 处理OAuth回调（从URL查询参数解析，不依赖路由query）
        const callbackParams = parseOAuthCallback()
        
        if (callbackParams) {
          if (callbackParams.error) {
            // OAuth授权失败
            console.error('[Router] OAuth授权失败:', callbackParams.error, callbackParams.errorDescription)
            next({ path: '/', query: { error: callbackParams.error } })
            return
          }
          
          if (callbackParams.code && callbackParams.state) {
            // 处理OAuth回调
            try {
              const success = await handleOAuthCallback(callbackParams.code, callbackParams.state)
              
              if (success) {
                // 授权成功，重定向到之前保存的路径
                const redirectUri = getAndClearRedirectUri()
                const targetPath = redirectUri || '/'
                
                // 在hash模式下，需要手动清理URL中的查询参数
                const baseUrl = window.location.origin
                const hashPath = targetPath.startsWith('/') ? targetPath : '/' + targetPath
                const cleanUrl = baseUrl + '#' + hashPath
                console.log('[Router] OAuth授权成功，准备跳转到:', cleanUrl)
                window.location.replace(cleanUrl)
              } else {
                // 授权失败，清除URL中的OAuth参数并跳转
                console.error('[Router] OAuth授权失败，清除URL参数并跳转')
                const baseUrl = window.location.origin
                const cleanUrl = baseUrl + '#/?error=authorization_failed'
                console.log('[Router] 准备跳转到错误页面:', cleanUrl)
                window.location.replace(cleanUrl)
              }
            } catch (error) {
              // 捕获所有错误（包括网络错误、CORS错误等）
              console.error('[Router] OAuth回调处理异常:', error)
              const baseUrl = window.location.origin
              const errorMessage = error.message || 'authorization_failed'
              // URL编码错误信息
              const encodedError = encodeURIComponent(errorMessage)
              const cleanUrl = baseUrl + `#/?error=authorization_failed&error_description=${encodedError}`
              console.log('[Router] 发生异常，准备跳转到错误页面:', cleanUrl)
              // 使用 replace 确保不会在历史记录中留下记录
              window.location.replace(cleanUrl)
            }
            return
          }
        }
        
        next('/')
      },
    },
    {
      path: '*',
      name: 'NotFound',
      component: () => import('./views/404.vue'),
    },
  ],
})

// 路由守卫：检查是否需要认证
router.beforeEach((to, from, next) => {
  // 首先检查URL中是否有OAuth回调参数（必须在最前面检查，避免路由匹配到其他路由）
  const urlParams = new URLSearchParams(window.location.search)
  const hasOAuthCode = urlParams.get('code')
  const hasOAuthState = urlParams.get('state')
  const hasOAuthError = urlParams.get('error')
  
  // 如果URL中有OAuth回调参数，必须确保路由匹配到/oauth/callback
  // 这个检查必须在最前面，避免路由匹配到其他路由（如/）导致组件提前加载
  if ((hasOAuthCode && hasOAuthState) || hasOAuthError) {
    // 如果路由已经匹配到/oauth/callback，让beforeEnter处理，不要再次跳转
    if (to.path === '/oauth/callback') {
      next()
      return
    }
    const query = {}
    if (hasOAuthCode) query.code = hasOAuthCode
    if (hasOAuthState) query.state = hasOAuthState
    if (hasOAuthError) query.error = hasOAuthError
    if (urlParams.get('error_description')) query.error_description = urlParams.get('error_description')
    
    // 强制跳转，阻止当前路由继续，使用replace避免在历史记录中留下记录
    // 跳转后路由会重新匹配到/oauth/callback，触发beforeEnter处理OAuth回调
    next({ path: '/oauth/callback', query, replace: true })
    return
  }
  
  // 检查路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 检查是否有认证凭证（token 或 refresh_token）
    const token = getToken()
    const refreshToken = getRefreshToken()
    
    console.log('[Router] 认证检查:', { 
      hasToken: !!token, 
      hasRefreshToken: !!refreshToken 
    })
    
    if (token || refreshToken) {
      // 有 token 或 refresh_token，允许通过
      // 如果只有 refresh_token，axios 拦截器会在请求时自动刷新
      console.log('[Router] 有认证凭证，允许访问')
      next()
    } else {
      // 没有认证凭证，重定向到授权页面
      console.log('[Router] 没有认证凭证，重定向到授权服务器')
      redirectToAuthorization(to.fullPath)
      return
    }
  } else {
    console.log('[Router] 路由不需要认证，直接通过')
    next()
  }
})

export default router