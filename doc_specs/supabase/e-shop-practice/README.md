# Supabase 專案：e-shop-practice

- Project ID: `kaoxjrxoqzygojubmmtf`
- Region: ap-northeast-1
- Postgres: 17.6.1

## 資料表總覽

| 資料表 | 用途 | RLS | 現有資料筆數 |
|---|---|---|---|
| [products](./products/schema.md) | 商品主檔（含 `seed_stock` 供每日重置用） | 所有人可讀，寫入需 `'products' = ANY(user_profiles.admin_item)` | 24 |
| [products_audit_log](./products_audit_log/schema.md) | `products` 的更新/刪除操作紀錄 | 僅對 `products` 有管理權限者可讀，無法手動寫入（trigger 自動產生） | – |
| [user_profiles](./user_profiles/schema.md) | 用戶個人資料 + 購物車 + 收藏 + 權限（1:1 對應 `auth.users`） | 僅本人可讀寫 | 1 |
| [user_profiles_audit_log](./user_profiles_audit_log/schema.md) | `user_profiles` 的更新/刪除操作紀錄 | 僅對 `user_profiles` 有管理權限者可讀，無法手動寫入（trigger 自動產生） | – |
| [orders](./orders/schema.md) | 訂單（含明細 `items` jsonb、`applied_coupon_codes`，✅ 已移除 `user_id` FK 與重複的 `order_date`，改留 `created_at`） | 僅本人可讀取/新增，無 UPDATE/DELETE policy，狀態變更一律走 RPC | 5 |
| [orders_audit_log](./orders_audit_log/schema.md) | `orders` 的更新操作紀錄（目前只會記「取消訂單」） | 僅對 `orders` 有管理權限者可讀，無法手動寫入（trigger 自動產生） | – |
| [coupon_templates](./coupon_templates/schema.md) | 優惠券範本（雙狀態機設計 + `discount_value`/`threshold_amount`，✅ 已套用重新設計） | 所有人可讀，寫入需 `'coupon_templates' = ANY(user_profiles.admin_item)` | 4（demo 優惠券） |
| [coupon_templates_audit_log](./coupon_templates_audit_log/schema.md) | `coupon_templates` 的更新/刪除操作紀錄 | 僅對 `coupon_templates` 有管理權限者可讀，無法手動寫入（trigger 自動產生） | – |
| [site_config](./site_config/schema.md) | 站台設定（key-value / jsonb） | **已啟用但無任何 policy**（見下方警告） | 3 |

## RPC

| 函式 | 用途 | 對應資料表 |
|---|---|---|
| `create_order(p_items, p_shipping_fee, p_discount, p_shipping_address, p_payment_method, p_applied_coupon_codes, p_note)` | 建立訂單，同一交易內檢查+扣 `products.stock`，`user_id` 用 `auth.uid()` | [orders](./orders/schema.md)、[products](./products/schema.md) |
| `cancel_order(p_order_id)` | 取消訂單（限 `pending` 狀態、限本人），同一交易內回補 `products.stock` | [orders](./orders/schema.md)、[products](./products/schema.md) |
| `daily_demo_reset()` | 每日重置排程呼叫，見下方「每日重置（demo 用，pg_cron）」 | `auth.users`、[orders](./orders/schema.md)、[products](./products/schema.md) |

以上三支皆為 `SECURITY DEFINER`，且已 `REVOKE EXECUTE FROM PUBLIC`：`create_order`/`cancel_order` 只開放給 `authenticated`；`daily_demo_reset` 完全不開放給任何前端角色，只有 `pg_cron`（以 `postgres` 身分）能呼叫。

## 每日重置（demo 用，pg_cron）

因為這是放在履歷上、開放給不同面試官各自註冊帳號測試的 demo 專案，需要每天恢復到乾淨狀態，避免前一位面試官的操作（例如把商品全部下單缺貨）影響下一位。

- 排程：`daily_demo_reset` job，`0 20 * * *`（UTC 20:00 = 台北時間 04:00，離峰時段執行，降低砍帳號時剛好有人在線上操作的機率）
- 動作：
  1. `DELETE FROM auth.users WHERE email <> '<保留帳號 email>'`（保留帳號目前寫死一個 email，見 `daily_demo_reset()` 函式內容；`auth` schema 內的關聯資料由 Supabase 內建 FK cascade 一併清除）
  2. `DELETE FROM orders WHERE user_id NOT IN (SELECT id FROM auth.users)`（`orders.user_id` 已無 FK，不會自動 cascade，需手動清理）
  3. `UPDATE products SET stock = seed_stock`
- 面試官各自註冊帳號測試，天生互相隔離（`user_profiles`/`orders`/購物車都各自獨立），**唯一真正共用會被互相影響的資源是 `products.stock`**，這也是為什麼一定要有這個排程

## 管理員權限機制（已統一）

全站唯一機制：`user_profiles.admin_item`（`text[]`），陣列裡放表名代表對該表具管理權限，判斷式固定為
`EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND '表名' = ANY(admin_item))`。
目前已套用在 `products` 與 `coupon_templates`（含各自的 audit_log 讀取權限）；`user_profiles_audit_log` 用 `'user_profiles' = ANY(admin_item)`。

## ⚠️ 待處理事項

`site_config` 表 `rls_enabled = true`，但查無任何 RLS policy。
在 PostgREST 規則下，這代表**除了 service_role 之外任何角色（含 anon/authenticated）完全無法讀寫**，
目前前端若要用 anon key 讀取 `site_config`（首頁輪播圖、聯絡資訊等公開資料）會直接被擋下。
若這兩張表本意是要對外公開讀取，需要另外補上 `SELECT` policy。
