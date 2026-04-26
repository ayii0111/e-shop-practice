# Supabase 練習專案交接文件

## 給 Kiro 的指示

請你閱讀完這份文件後，直接開始執行「初始化步驟」，不需要再詢問確認。

---

## 專案背景

這是一個獨立的 Supabase 入門練習專案，與主專案（e-shop 電商前端）分開。
目的是讓開發者在實作主專案之前，先對 Supabase 的核心功能有實際操作經驗。

---

## 技術棧

- Vite + Vue 3 + TypeScript
- axios（用來直接打 Supabase REST API，不透過 SDK，目的是理解底層機制）
- Supabase JS SDK（僅限 Auth 部分使用，因為 OAuth 流程有重導向，不適合純 axios 處理）
- 不加任何 UI library，專注在邏輯

---

## 初始化步驟（請 Kiro 執行）

### 第一步：確認 vite 建立時的功能選項

專案是用 `npm create vite` 建立的，但建立時選了哪些功能不確定，請你先檢視專案目錄結構與 `package.json`，判斷目前有哪些依賴，再決定後續要補裝什麼。

### 第二步：安裝必要套件

需要安裝的套件：
- `axios`
- `@supabase/supabase-js`（僅用於 Auth）

### 第三步：建立環境變數檔案

建立 `.env` 檔案（加入 `.gitignore`），格式如下：

```
VITE_SUPABASE_URL=你的專案URL
VITE_SUPABASE_ANON_KEY=你的anon金鑰
```

並建立 `.env.example` 作為範本（不含真實金鑰）。

### 第四步：建立基本的 axios 實例與 supabase auth 實例

- `src/lib/api.ts`：封裝 axios，預設帶入 Supabase 所需的 Header
- `src/lib/supabase.ts`：初始化 Supabase client（僅用於 Auth）

### 第五步：依照作業順序建立對應的練習頁面與路由

---

## 學習作業清單

### 作業 1：環境建立 + 第一次查詢
- 在 Supabase Dashboard 手動建立 `products` 資料表
  - 欄位：`id`（uuid, primary key）、`name`（text）、`price`（numeric）、`category`（text）、`created_at`（timestamp）
- 手動新增幾筆假資料
- 用 axios 打 Supabase REST API 把資料撈出來，顯示在頁面上
- 學習重點：理解 Supabase REST API 的 URL 結構與必要 Header

### 作業 2：CRUD 練習
- 用 axios 實作：
  - 新增商品（POST）
  - 修改商品（PATCH）
  - 刪除商品（DELETE）
  - 條件查詢（篩選分類、價格排序）
- 學習重點：理解 PostgREST 的 query 語法（`?select=`、`?order=`、`?category=eq.xxx`）

### 作業 3：Auth 整合（Google OAuth）
- 使用 Supabase SDK 的 `signInWithOAuth` 觸發 Google 登入流程
- 理解 OAuth 重導向機制：登入後 Supabase 會把 token 帶回前端 URL
- 用 `supabase.auth.getSession()` 取得 session，把 user 資訊存到 Pinia store
- 實作登出
- 實作 RLS（Row Level Security）：
  - 未登入只能讀取資料
  - 登入後才能新增 / 修改 / 刪除
- 學習重點：理解 JWT token 的角色、RLS 如何在資料庫層保護資料

### 作業 4：Storage 練習
- 在 Supabase Dashboard 建立一個 storage bucket（`product-images`）
- 用 axios 打 Supabase Storage REST API 上傳圖片
- 取得圖片的公開 URL
- 把 URL 更新到 `products` 資料表的 `image_url` 欄位
- 學習重點：理解 Supabase Storage 的 API 結構，與一般 REST API 的差異

---

## 作業進度

- [ ] 作業 1：環境建立 + 第一次查詢
- [ ] 作業 2：CRUD 練習
- [ ] 作業 3：Auth 整合（Google OAuth）
- [ ] 作業 4：Storage 練習

---

## 備註

- 這個練習專案與主專案（e-shop）無關，不需要參考主專案的程式碼
- 所有作業完成後，學到的模式會直接套用回主專案的數據流設計
- Auth 部分雖然使用 SDK 觸發登入，但重點是理解 OAuth 流程與 token 機制，不是逃避學習
