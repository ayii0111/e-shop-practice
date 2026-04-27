import { createRouter, createWebHashHistory } from 'vue-router'
import HomeBody from '../layouts/Body/HomeBody.vue' // 靜態匯入 Home 組件
import ProductCategoryBody from '../layouts/Body/ProductCategoryBody.vue'
import ProductList from '../layouts/Body/ProductCategory/ProductList.vue'
import { LoginPage, MainPage } from '../pages'

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
          path: 'productCategory',
          component: ProductCategoryBody,
          children: [
            {
              path: 'ProductList/:category',
              name: 'ProductList',
              component: ProductList,
            },
          ],
        },
        {
          path: '/products/:id',
          name: 'ProductDetailBody',
          component: () => import('../layouts/Body/ProductDetailBody.vue'),
        },
      ],
    },

  ],
})

export default router
