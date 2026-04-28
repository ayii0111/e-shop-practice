import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { clerkPlugin } from 'vue-clerk'
import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'
import ToastService from 'primevue/toastservice'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import './assets/tw.css'
import App from './App.vue'
import router from './router'

library.add(fas)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(ToastService)
const preset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{zinc.50}',
      100: '{zinc.100}',
      200: '{zinc.200}',
      300: '{zinc.300}',
      400: '{zinc.400}',
      500: '{zinc.500}',
      600: '{zinc.600}',
      700: '{zinc.700}',
      800: '{zinc.800}',
      900: '{zinc.900}',
      950: '{zinc.950}',
    },
  },
})

app.use(PrimeVue, {
  // Default theme configuration
  theme: {
    preset,
    options: {
      // 設定主題所屬 css變數、class 的前綴
      // 例如 --p-primary-color
      prefix: 'p',
      // 深色模式隨瀏覽器決定
      darkModeSelector: 'light',
      cssLayer: {
        name: 'primevue',
        order: 'reset, tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
})
app.use(clerkPlugin, {
  publishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
})
app.mount('#app')
