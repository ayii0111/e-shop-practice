# products_audit_log（商品操作紀錄審查日誌）

PK: `log_id`。記錄 [products](../products/schema.md) 每一次 UPDATE / DELETE 的操作者與異動前後快照，
取代原本 `products.updated_at` 只能記「最後一次時間」的做法。

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 欄位
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `log_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵 |
| `product_id` | uuid | NOT NULL | – | 對應被異動的商品，**未設 FK**——刻意如此，避免商品被刪除時日誌被級聯刪除，稽核紀錄要保留 |
| `action` | text | NOT NULL | – | `update` / `delete`（未加 CHECK 約束，合法值靠 trigger 寫入邏輯保證，不接受外部任意寫入） |
| `operated_by` | uuid | NOT NULL | – | 操作者 `auth.uid()`，未設 FK |
| `operated_at` | timestamptz | NOT NULL | `now()` | 操作時間，取代原 `products.updated_at` |
| `old_data` | jsonb | NOT NULL | – | 異動前的整列快照（`to_jsonb(OLD)`） |
| `new_data` | jsonb | – | – | 異動後的整列快照，`action = 'delete'` 時為 NULL |

## 寫入機制
由 trigger `trigger_log_products_change`（`AFTER UPDATE OR DELETE ON products`）呼叫函式 `log_products_change()` 自動寫入，
非開放給前端直接 INSERT 的表。函式屬性：
- `SECURITY DEFINER` + `SET search_path = ''`：以函式擁有者權限執行，避免 search_path 注入
- 若 `auth.uid()` 為 `NULL`（例如排程／`service_role` 操作）→ **略過寫入**，只記錄「有登入身分」的異動
- 已 `REVOKE EXECUTE FROM public, anon, authenticated`，避免被當成 PostgREST RPC（`/rest/v1/rpc/log_products_change`）直接呼叫

只記錄 UPDATE / DELETE，**不記錄 INSERT**（新增當下的資料就是第一筆真實狀態，不需要額外快照）。

## RLS Policy
啟用 RLS，僅一條 `SELECT` policy：`'products' = ANY(user_profiles.admin_item)` 的使用者可讀，其餘角色（含 `authenticated` 一般會員）皆不可讀。
無 INSERT/UPDATE/DELETE policy → 一般 client 完全無法寫入或竄改日誌，只能透過 trigger（`SECURITY DEFINER`）產生。

## 索引
僅有主鍵索引 `products_audit_log_pkey`。**未對 `product_id` 建索引**——若之後要「查某商品的完整異動歷史」會是全表掃描，
與 [coupon_templates_audit_log](../coupon_templates_audit_log/schema.md) 有對 `template_id` 建索引的做法不一致，資料量變大後建議補上。
