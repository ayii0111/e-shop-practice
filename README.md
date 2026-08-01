# E-Shop Practice

一個以 Vue 3 + TypeScript 打造的電商前端專案，串接 Supabase（資料 / 驗證）與 Firebase（圖片儲存），實作商品瀏覽、購物車、結帳、會員中心等完整購物流程。

**線上展示：** https://ayii0111.github.io/e-shop-practice/

## 專案重點

- **完整購物流程**：首頁 → 商品列表 → 商品詳情 → 購物車 → 結帳 → 會員中心（個人資料 / 優惠券 / 訂單紀錄）
- **狀態管理設計**：以 Pinia 管理購物車與登入狀態，App 啟動時自動從 Supabase 同步購物車內容；下單完成後自動清空購物車；送貨資訊空欄位會反向同步回雲端
- **API 層封裝**：不使用官方 Supabase JS SDK，改以 axios 建立 REST / Auth 兩個實例，並透過 interceptor 統一處理 Bearer token 注入與 401 自動 refresh
- **第三方登入**：整合 Firebase Auth 做 OAuth 登入
- **元件化 UI**：以 PrimeVue 4 + Tailwind CSS 建立響應式版面，商品卡片、輪播、側邊分類導覽等皆抽成獨立元件

## 技術棧

| 分類 | 技術 |
|------|------|
| 框架 | Vue 3 (Composition API) + TypeScript |
| 建構工具 | Vite 6 |
| UI | PrimeVue 4、Tailwind CSS v3 |
| 狀態管理 | Pinia |
| 後端服務 | Supabase（REST API + Auth）、Firebase（圖片儲存） |
| 其他 | axios、await-to-js、Vue Router（hash history） |

## 功能一覽

- 首頁：輪播、分類導覽、新品／熱門商品展示、優惠訊息
- 商品列表：依分類篩選、響應式排版
- 商品詳情頁
- 購物車：新增／刪除／勾選商品，與雲端即時同步
- 結帳流程：送貨資訊填寫，異動即時反向同步至 Supabase
- 會員中心：個人資料維護、優惠券領取與查看、歷史訂單查詢
- OAuth 第三方登入（Firebase Auth）

## 快速開始

```bash
npm install
npm run dev          # 啟動開發伺服器
npm run build         # 型別檢查 + 打包
```

## 專案結構

```
src/
├── pages/          # 頂層頁面容器
├── layouts/Body/   # 各路由對應的內容元件
├── components/     # 共用元件
├── stores/         # Pinia stores
├── services/       # API 層（Supabase / Firebase）
├── router/         # 路由設定
└── util/           # 工具函式
```
