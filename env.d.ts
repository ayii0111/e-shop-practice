/// <reference types="vite/client" />

declare module '*.vue' {
  import type { ComponentOptions } from 'vue'

  const componentOptions: ComponentOptions
  export default componentOptions
}

// const to: typeof import('await-to-js')['to']
