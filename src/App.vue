<script setup lang="ts">
import Header from './layouts/Header.vue'
import Body from './layouts/Body.vue'
import Footer from './layouts/Footer.vue'

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
</script>

<template>
  <div class="mx-auto px-2 sm:px-16 lg:px-4 max-w-[1140px] container">
    <Header />

    <Body />
    <Footer />
    <!-- 斷點指示器（開發用） -->
    <div class="right-4 bottom-4 z-[9999] fixed bg-black/70 px-3 py-1 rounded-full font-mono text-white text-xs">
      {{ current }}
    </div>
  </div>
</template>

<style>
@font-face {
  font-family: 'Noto Sans TC';
  /* 載入字型檔案（需指定字體檔案類型） */
  src: url('/src/assets/NotoSansTC-VariableFont_wght.ttf') format('opentype');
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
  --secondary-text-color: #818181;
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
