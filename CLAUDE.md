# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # 啟動開發伺服器（自動開啟瀏覽器）
npm run build        # 型別檢查 + 打包（run-p type-check + build-only）
npm run type-check   # vue-tsc 型別檢查
npm run lint         # ESLint --fix
npm run test:unit    # Vitest 單元測試
```

## Architecture

### Tech Stack
- **框架**：Vue 3 (Composition API) + TypeScript
- **打包**：Vite 6，base 路徑為 `/e-shop-practice/`，使用 hash history
- **UI**：PrimeVue 4（Aura 主題，zinc 色系）+ Tailwind CSS v3
- **狀態**：Pinia
- **後端**：Supabase REST API + Auth API（透過 axios 實例，非官方 JS SDK）
- **其他**：Firebase（儲存圖片）、`await-to-js` 的 `to()` 統一處理非同步錯誤

### Auto-import（不需手動 import）
`unplugin-auto-import` 自動引入：
- `vue`（ref、computed、watch…等）
- `vue-router`（useRouter、useRoute + `RouteLocationRaw` 型別）
- `@vueuse/core`
- `await-to-js` 的 `to`

`unplugin-vue-components` 自動引入 `src/components`、`src/views`、`src/layouts` 下所有 `.vue` 元件，不需手動 import。

### Path Aliases
| 別名 | 對應路徑 |
|------|---------|
| `@` | `src/` |
| `@services` | `src/services/` |
| `@stores` | `src/stores/` |
| `@util` | `src/util/` |
| `@icon` | `src/assets/icon/` |

### Directory Structure

```
src/
├── pages/          # 頂層頁面容器（LoginPage、MainPage）
├── layouts/Body/   # 各路由的 Body 內容
│   ├── HomeBody.vue
│   ├── ProductsDisplayBody.vue
│   ├── ProductDetailBody.vue
│   ├── CartBody.vue
│   ├── CheckoutBody.vue
│   ├── UserDashboardBody.vue
│   ├── ProductDisplay/  # 商品列表相關元件與 composables
│   └── UserDashboard/   # 用戶儀表板分頁（Profile / Coupon / Orderlist）
├── components/     # 共用元件
├── stores/         # Pinia stores（全部由 index.ts 統一匯出）
├── services/       # API 層（全部由 index.ts 統一匯出）
├── router/         # Vue Router（hash history）
└── util/           # 工具函式
```

### Router
使用 hash history（`createWebHashHistory`）。主要路由結構：
- `/user/` → LoginPage（登入頁，獨立 page）
- `/` → MainPage（含 Header/Footer 的主框架）
  - `''` → HomeBody
  - `products-display-body/product-list/:productList` → 商品列表
  - `products/:id` → 商品詳情
  - `cart` → 購物車
  - `checkout` → 結帳
  - `dashboard/` → 用戶儀表板（profile / coupon / orderlist 子路由）

### Pinia Stores
| Store | 用途 |
|-------|------|
| `useAuthStore` | 認證狀態，auth 資料存於 localStorage（`sb_user`、`sb_access_token`、`sb_refresh_token`） |
| `useCartStore` | 購物車商品列表與勾選狀態，app 啟動時呼叫 `init(userId)` 從 Supabase 同步 |
| `useToastStore` | 全域 Toast 通知，需在 setup 階段呼叫 `init()` 初始化 |
| `useJsonViewStore` | 開發用 JSON 檢視器 |

### Services（`src/services/`）
- **`api-base.ts`**：建立兩個 axios 實例—`supabaseApi`（`/rest/v1`）與 `supabaseAuth`（`/auth/v1`）。Request interceptor 自動注入 Bearer token；response interceptor 攔截 401，自動 refresh token，失敗則清除 auth 並導向首頁。
- **`api.ts`**：所有 API 呼叫（商品列表、商品詳情、收藏、購物車）。對 `user_profiles` 的寫入一律用「讀取 → 前端修改 → 整個覆寫（PATCH）」模式（做法 A）。
- **`type.ts`**：共用型別（`Product`、`CartItem`、`RawCartEntry`、`RawProduct`）。
- **`firebase.ts`**：Firebase App / Auth / Firestore 實例。

### 環境變數（`.env`）
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

### 錯誤處理慣例
所有 API 呼叫使用 `to()` 包裝，避免 try/catch 巢狀：
```ts
const [error, resp] = await to(supabaseApi.get('/...')) as [Error, any]
if (error) { /* 處理 */ }
```
