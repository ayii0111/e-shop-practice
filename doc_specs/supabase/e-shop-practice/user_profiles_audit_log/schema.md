# user_profiles_audit_log（用戶個資操作紀錄審查日誌）

PK: `log_id`。記錄 [user_profiles](../user_profiles/schema.md) 每一次 UPDATE / DELETE 的操作者與異動前後快照，
取代原本 `user_profiles.updated_at` 只能記「最後一次時間」的做法。架構與
[products_audit_log](../products_audit_log/schema.md)、[coupon_templates_audit_log](../coupon_templates_audit_log/schema.md) 完全同一套模式。

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 欄位
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `log_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵 |
| `user_id` | uuid | NOT NULL | – | 對應被異動的個資列，**未設 FK**——避免使用者被刪除時日誌被級聯刪除，稽核紀錄要保留 |
| `action` | text | NOT NULL | – | `update` / `delete`，合法值靠 trigger 寫入邏輯保證 |
| `operated_by` | uuid | NOT NULL | – | 操作者 `auth.uid()`，未設 FK |
| `operated_at` | timestamptz | NOT NULL | `now()` | 操作時間，取代原 `user_profiles.updated_at` |
| `old_data` | jsonb | NOT NULL | – | 異動前的整列快照（含 `cart_list`、`liked_products` 等敏感度較高的欄位，見下方 RLS） |
| `new_data` | jsonb | – | – | 異動後的整列快照，`action = 'delete'` 時為 NULL |

## 寫入機制
由 trigger `trigger_log_user_profiles_change`（`AFTER UPDATE OR DELETE ON user_profiles`）呼叫函式 `log_user_profiles_change()` 自動寫入：
- `SECURITY DEFINER` + `SET search_path = ''`
- 若 `auth.uid()` 為 `NULL`（排程／`service_role` 操作）→ **略過寫入**，只記錄「有登入身分」的異動
- 已 `REVOKE EXECUTE FROM public, anon, authenticated`，避免被當成 PostgREST RPC 直接呼叫
- 只記錄 UPDATE / DELETE，不記錄 INSERT（新增個資列本身由 `insert_new_user_profile()` 這個 Auth trigger 處理，且新增當下沒有「異動前狀態」可比對）

## RLS Policy
啟用 RLS，僅一條 `SELECT` policy：`'user_profiles' = ANY(user_profiles.admin_item)` 的使用者可讀，其餘角色（含使用者本人）皆不可讀。
⚠️ 這張日誌包含使用者的地址、電話、生日等個資快照，比一般商品/優惠券的稽核紀錄敏感得多，若之後要開放給客服等非開發管理員查閱，建議額外評估要不要做欄位遮罩。

## 索引
`user_profiles_audit_log_pkey`（log_id）、`user_profiles_audit_log_user_id_idx`（依 `user_id` 查詢異動歷史用）。
