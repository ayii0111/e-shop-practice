<script setup lang="ts">
import { Toast } from 'primevue'
import { useJsonViewStore } from '@stores/useJsonViewStore'

const breakpoints = useBreakpoints({
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
})
const current = computed(() => {
  if (breakpoints['2xl'].value) { return '2xl' }
  if (breakpoints.xl.value) { return 'xl' }
  if (breakpoints.lg.value) { return 'lg' }
  if (breakpoints.md.value) { return 'md' }
  if (breakpoints.sm.value) { return 'sm' }
  return 'xs'
})

const { data } = useJsonViewStore()
</script>

<template>
  <Toast position="top-right" /> <!-- 放在根元件即可 -->

  <div class="mx-auto px-2 sm:px-16 lg:px-4 max-w-[1140px] container">
    <RouterView data-role="Page" />
    <!-- 斷點指示器（開發用） -->
    <div class="right-4 bottom-4 z-[9999] fixed bg-black/70 px-3 py-1 rounded-full font-mono text-white text-xs">
      {{ current }}
    </div>
  </div>
  <JSONView v-if="data" rootKey="頂層名稱" noBorder :data="data" />
</template>

<style>
@font-face {
  font-family: 'Noto Sans TC';
  /* 載入字型檔案（需指定字體檔案類型） */
  src: url('@/assets/NotoSansTC-VariableFont_wght.ttf') format('opentype');
  font-weight: normal;
  font-style: normal;
}

html {
  /* font-family:
    'Noto Sans TC',
    -apple-system,
    'system-ui',
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji',
    'Segoe UI Symbol',
    'Noto Color Emoji' !important; */
}

:root {
  --primary-text-color: #212529;
  --secondary-color: #e6dfd7;
  --danger-color: #dc3545;
  --third-color: #d2c5b8;
  --dark-button: #343a3f;
  --gray-icon: #6c757d;
  --gray-bg: #f8f9fa;
  --third-color: #818181;

  /* RGB 分量，供 rgba() 搭配透明度使用 */
  --primary-text-color-rgb: 33, 37, 41;
  --secondary-color-rgb: 230, 223, 215;
  --dark-button-rgb: 52, 58, 63;
  --third-color-rgb: 210, 197, 184;
}

@layer reset {
  body {
    color: var(--primary-text-color);
  }

  li {
    list-style: none;
  }

  a {
    text-decoration: none;

    vertical-align: middle;
  }

  img {
    vertical-align: middle;

    object-fit: contain;

    max-width: 100%;
  }

  p,
  h1,
  h2,
  h3,
  h4,
  h5,
  ul,
  ol,
  dl {
    margin: 0;
  }

  ol,
  ul {
    padding: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
}
</style>
