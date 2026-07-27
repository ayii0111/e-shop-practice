# Supabase 專案：e-shop-practice

- Project ID: `kaoxjrxoqzygojubmmtf`
- Region: ap-northeast-1
- Postgres: 17.6.1

## 資料表總覽

| 資料表 | 用途 | RLS | 現有資料筆數 |
|---|---|---|---|
| [products](./products/schema.md) | 商品主檔 | 開放讀寫（見表內說明） | 24 |
| [user_profiles](./user_profiles/schema.md) | 用戶個人資料 + 購物車 + 收藏（1:1 對應 `auth.users`） | 僅本人可讀寫 | 1 |
| [orders](./orders/schema.md) | 訂單（含明細 `items` jsonb） | 僅本人可讀取/新增 | 5 |
| [coupon_templates](./coupon_templates/schema.md) | 優惠券範本（雙狀態機設計） | **已啟用但無任何 policy**（見下方警告） | 0 |
| [site_config](./site_config/schema.md) | 站台設定（key-value / jsonb） | **已啟用但無任何 policy**（見下方警告） | 3 |

## ⚠️ 待處理事項

`coupon_templates`、`site_config` 兩表 `rls_enabled = true`，但查無任何 RLS policy。
在 PostgREST 規則下，這代表**除了 service_role 之外任何角色（含 anon/authenticated）完全無法讀寫**，
目前前端若要用 anon key 讀取 `site_config`（首頁輪播圖、聯絡資訊等公開資料）會直接被擋下。
若這兩張表本意是要對外公開讀取，需要另外補上 `SELECT` policy。
