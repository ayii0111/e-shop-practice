import { createRouter, createWebHashHistory } from 'vue-router'
import HomeBody from '../layouts/Body/HomeBody.vue' // 靜態匯入 Home 組件
import ProductCategoryBody from '../layouts/Body/ProductCategoryBody.vue'
import ProductList from '../layouts/Body/ProductCategory/ProductList.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/user/',
      name: 'user',
      component: () => import('../views/User.vue'),
    },
    {
      path: '/',
      name: 'Home',
      component: HomeBody,
    },
    {
      path: '/productCategory',
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
})

export default router
