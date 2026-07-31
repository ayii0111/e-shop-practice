# orders_audit_log（訂單操作紀錄審查日誌）

> ✅ 本文件記錄的設計**已套用到雲端 Supabase**（migration: `orders_audit_log`）。

PK: `log_id`。記錄 [orders](../orders/schema.md) 每一次 UPDATE 的操作者與異動前後快照，跟 `products_audit_log`／`coupon_templates_audit_log` 同一套模式。

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 欄位
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `log_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵，沿用全站慣例用 v7 讓日誌天然依時間排序 |
| `order_id` | uuid | NOT NULL | – | 對應被異動的訂單，**未設 FK**，理由同其餘稽核表：避免訂單被刪除時日誌被級聯清除 |
| `action` | text | NOT NULL, CHECK (`action = 'update'`) | – | 訂單設計上不會有 DELETE（取消訂單是改 `status`，不是刪資料列），所以直接把合法值鎖死只有 `'update'`，比 `products_audit_log` 用未加 CHECK 的做法更嚴謹一點 |
| `operated_by` | uuid | NOT NULL | – | 操作者 `auth.uid()`，未設 FK；目前唯一會寫入這張表的路徑是 `cancel_order` RPC，所以這裡的值目前等同「取消訂單的使用者本人」 |
| `operated_at` | timestamptz | NOT NULL | `now()` | 操作時間 |
| `old_data` | jsonb | NOT NULL | – | 異動前的整列快照 |
| `new_data` | jsonb | – | – | 異動後的整列快照 |

## 寫入機制
由 trigger `trigger_log_orders_change`（`AFTER UPDATE ON orders`）呼叫函式 `log_orders_change()` 自動寫入：
- `SECURITY DEFINER` + `SET search_path TO 'pg_catalog', 'public'`
- `auth.uid() IS NULL` 時略過寫入
- 已 `REVOKE EXECUTE FROM public, anon, authenticated`

`orders` 本身**沒有任何 UPDATE/DELETE 的 RLS policy**（刻意維持空白），所有狀態變更只能透過 `cancel_order` 這支 `SECURITY DEFINER` RPC 進行，
所以目前這張日誌實際上只會記錄「使用者取消自己訂單」這一種異動，還沒有「管理員改出貨狀態」這類操作（不在目前功能範圍內，見 [orders](../orders/schema.md)）。

## RLS Policy
僅一條 `SELECT` policy：`'orders' = ANY(user_profiles.admin_item)` 的使用者可讀。無 INSERT/UPDATE/DELETE policy。

## 索引
`orders_audit_log_order_id_idx`（order_id），方便依訂單查詢異動歷史。
