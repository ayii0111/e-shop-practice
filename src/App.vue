<script setup lang="ts">
import Header from './layouts/Header.vue'
import Body from './layouts/Body.vue'
import Footer from './layouts/Footer.vue'
</script>

<template>
  <div class="container mx-auto max-w-[1140px] px-4">
    <Header />

    <Body />
    <Footer />
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
