import { URL, fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import AutoImport from 'unplugin-auto-import/vite'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  base: '/e-shop-practice/', // 改成相對路徑
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },

  server: {
    open: true, // vite项目启动时自动打开浏览器
  },
  plugins: [
    vue(),
    Components({
      // resolvers: [
      //   PrimeVueResolver(),
      // ],
      dirs: ['src/components', 'src/views', 'src/layouts'],
      deep: true,
    }),
    AutoImport({
      include: [
        /.[tj]sx?$/,
        /.vue$/,
        /.vue?vue/,
        /.md$/,
      ],
      imports: [
        'vue',
        'vue-router',
        // 需在安裝 vueuse 後，才能解開下面註解
        '@vueuse/core',
        // 引入型別模組
        {
          from: 'vue-router',
          imports: ['RouteLocationRaw'],
          type: true,
        },
      ],
      defaultExportByFilename: false,
      dts: './auto-imports.d.ts',
      vueTemplate: false,
      injectAtEnd: true,
      eslintrc: {
        enabled: false,
        filepath: './.eslintrc-auto-import.json',
        globalsPropValue: true,
      },
    }),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@icon': fileURLToPath(new URL('./src/assets/icon', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),

    },
  },
})
