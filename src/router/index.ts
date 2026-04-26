import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../layouts/Body/HomeBody.vue' // 靜態匯入 Home 組件
import Products from '../layouts/Body/ProductsBody.vue'
import ProductList from '../layouts/Body/Products/ProductList.vue'
import SideNavbar from '../layouts/Body/Products/SideNavbar.vue'

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
      component: Home,
    },
    {
      path: '/products',
      component: Products,
      children: [
        {
          path: 'cloth/product',
          component: () => import('../layouts/Body/Products/Product.vue'),
        },
        {
          path: ':category',
          name: 'Products',
          components: {
            ProductList,
            SideNavbar,
          },
        },
      ],
    },

  ],
})

export default router
