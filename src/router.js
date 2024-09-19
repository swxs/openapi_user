import Vue from 'vue'
import Router from 'vue-router'
import Index from './views/index.vue'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Index,
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
    },
    {
      path: '*',
      name: 'NotFound',
      component: () => import('./views/404.vue'),
    },
  ],
})
