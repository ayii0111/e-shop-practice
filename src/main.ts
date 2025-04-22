import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/tw.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'
import ToastService from 'primevue/toastservice'
import { definePreset } from '@primevue/themes'
import App from './App.vue'
import router from './router'
import 'bootstrap-icons/font/bootstrap-icons.css' // 匯入 CSS
import 'primeicons/primeicons.css'

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

app.mount('#app')
