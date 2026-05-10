import { createRouter, createWebHashHistory } from 'vue-router'

import { LoginPage, MainPage } from '../pages'
import HomeBody from '../layouts/Body/HomeBody.vue' // 靜態匯入 Home 組件
import ProductList from '../layouts/Body/ProductDisplay/ProductList.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 一個整個 page 頁面，必要時可以改為，小的彈出視窗即可
      // 因為整合那個第三方登入服務，更方便
      path: '/user/',
      name: 'user',
      component: LoginPage,
    },
    {
      path: '/',
      component: MainPage,
      children: [
        {
          path: '',
          name: 'Home',
          component: HomeBody,
        },
        {
          path: 'products-display-body',
          component: () => import('../layouts/Body/ProductsDisplayBody.vue'),
          children: [
            {
              path: 'product-list/:productList',
              name: 'product-list',
              component: ProductList,
              meta: { scrollToTop: true },
            },
          ],
        },
        {
          path: 'products/:id',
          name: 'ProductDetailBody',
          component: () => import('../layouts/Body/ProductDetailBody.vue'),
        },
        {
          path: 'cart',
          name: 'CartBody',
          component: () => import('../layouts/Body/CartBody.vue'),
        },
        {
          path: 'dashboard/',
          name: 'UserDashboardBody',
          component: () => import('../layouts/Body/UserDashboardBody.vue'),
          // ProfileTabPanel
          // CouponTabPanel
          children: [
            {
              path: 'profile',
              name: 'ProfileTabPanel',
              // /Users/ayii/Projects/e-shop-practice/src/layouts/Body/Dashboard/OrderlistTabPanel.vue
              component: () => import('../layouts/Body/UserDashboard/ProfileTabPanel.vue'),
            },
            {
              path: 'coupon',
              name: 'CouponTabPanel',
              // /Users/ayii/Projects/e-shop-practice/src/layouts/Body/Dashboard/OrderlistTabPanel.vue
              component: () => import('../layouts/Body/UserDashboard/CouponTabPanel.vue'),
            },
            {
              path: 'orderlist',
              name: 'OrderlistTabPanel',
              // /Users/ayii/Projects/e-shop-practice/src/layouts/Body/Dashboard/OrderlistTabPanel.vue
              component: () => import('../layouts/Body/UserDashboard/OrderlistTabPanel.vue'),
            },
          ],
        },
      ],
    },

  ],
  scrollBehavior (to, from, savedPosition) {
    if (to.meta.scrollToTop) {
      return { top: 0 } // 代表回到最頂端 (模擬「頁面跳轉」效果)
    }
    // 不加 return 或 return false 就會保持原本的滾動位置
    return false
  },
})

export default router
