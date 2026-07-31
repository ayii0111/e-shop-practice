# coupon_templates_audit_log（優惠券範本操作紀錄審查日誌）

PK: `log_id`。記錄 [coupon_templates](../coupon_templates/schema.md) 每一次 UPDATE / DELETE 的操作者與異動前後快照。

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 欄位
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `log_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵 |
| `template_id` | uuid | NOT NULL | – | 對應被異動的優惠券範本，**未設 FK**——避免範本被刪除時日誌被級聯刪除 |
| `action` | text | NOT NULL | – | `update` / `delete`，合法值靠 trigger 寫入邏輯保證 |
| `operated_by` | uuid | NOT NULL | – | 操作者 `auth.uid()`，未設 FK |
| `operated_at` | timestamptz | NOT NULL | `now()` | 操作時間 |
| `old_data` | jsonb | NOT NULL | – | 異動前的整列快照 |
| `new_data` | jsonb | – | – | 異動後的整列快照，`action = 'delete'` 時為 NULL |

## 寫入機制
由 trigger（`AFTER UPDATE OR DELETE ON coupon_templates`）呼叫函式 `log_coupon_templates_change()` 自動寫入，架構與
[products_audit_log](../products_audit_log/schema.md) 完全相同的模式：
- `SECURITY DEFINER` + `SET search_path = ''`
- 若 `auth.uid()` 為 `NULL`（排程／`service_role` 自動觸發，例如 `coupon_templates` 表的 [自動狀態排程](../coupon_templates/schema.md#排程實作已套用到雲端)）→ **略過寫入**，只記錄「有登入身分」的人為異動
- 只記錄 UPDATE / DELETE，不記錄 INSERT

## RLS Policy
啟用 RLS，僅一條 `SELECT` policy，條件：
```sql
EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.user_id = auth.uid()
    AND 'coupon_templates' = ANY(user_profiles.admin_item)
)
```
`admin_item` 是 `text[]`，陣列裡放表名，代表「對哪些表有管理權限」，屬於細粒度、逐表授權的設計；
`products` / `products_audit_log` 已統一改沿用同一套機制（見 [products](../products/schema.md)），全站僅此一套管理員判斷邏輯。

## 索引
`coupon_templates_audit_log_pkey`（log_id）、`coupon_templates_audit_log_template_id_idx`（依 `template_id` 查詢異動歷史用）。
