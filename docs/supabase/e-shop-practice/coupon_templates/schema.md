# coupon_templates（優惠券範本）

> ⚠️ 本文件目前記錄的是**目標設計（尚未套用到雲端 Supabase）**。
> 現況（雲端實際 schema）仍是舊版：有 `coupon_disenable`、有 `updated_by`/`updated_at`、沒有 `claim_enable`/`usability_enable`/`claim_manual`/`usability_manual`。
> 待正式決定要 migrate 時，再依本文件內容產生 migration。

待辦：(不要動它)
- 建立該表的審查日誌

PK: `template_id`（目前 0 筆資料，屬規劃中/尚未啟用的功能）

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 說明」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 基本資訊
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `template_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵，用 UUID v7 取代 `gen_random_uuid()`（v4），因時間戳前綴具排序性，索引寫入效能較 v4 佳，且可反查建立時間（見下方「主鍵改用 UUID v7」） |
| `coupon_name` | text | NOT NULL | – | 優惠券名稱 |
| `coupon_description` | text | – | – | 說明 |
| `terms_and_conditions` | text | – | – | 使用條款 |
| `coupon_code` | text | NOT NULL, UNIQUE | – | 兌換碼 |

## 主鍵改用 UUID v7

僅此表的 `template_id` 由 `gen_random_uuid()`（UUID v4）改為 `uuidv7()`（UUID v7），其餘表（`products`、`orders` 等）維持 v4 不變，暫不擴大範圍。

Postgres 17（此專案的引擎版本）沒有原生 `uuidv7()` 函式（要 PG 18 才內建），Supabase 平台可安裝的 extension 清單裡也沒有 `pg_uuidv7`，所以採用純 SQL function 的做法，來源是 PostgreSQL 社群常見引用的實作 [dverite/postgres-uuidv7-sql](https://github.com/dverite/postgres-uuidv7-sql)（作者 Daniel Vérité）：

```sql
-- 產生 UUID v7：前 48 bits 為毫秒時間戳，其餘為亂數，version/variant 位元正確設置
CREATE FUNCTION uuidv7(timestamptz DEFAULT clock_timestamp()) RETURNS uuid
AS $$
  select encode(
    set_bit(
      set_bit(
        overlay(uuid_send(gen_random_uuid()) placing
          substring(int8send((extract(epoch from $1)*1000)::bigint) from 3)
          from 1 for 6),
        52, 1),
      53, 1), 'hex')::uuid;
$$ LANGUAGE sql volatile parallel safe;

-- 反查：從 UUID v7 取出其建立時間（debug/稽核用，非必要但建議一併建立）
CREATE FUNCTION uuidv7_extract_timestamp(uuid) RETURNS timestamptz
AS $$
  select to_timestamp(
    right(substring(uuid_send($1) from 1 for 6)::text, -1)::bit(48)::int8
    /1000.0);
$$ LANGUAGE sql immutable strict parallel safe;
```

`uuidv7()` 回傳型別本身就是 `uuid`（非文字再轉型），可直接作為 `template_id` 的 `DEFAULT`，前端/PostgREST 收到的格式與現行 UUID 完全一致，不需改動任何呼叫端程式碼。

## 折扣類型
| 欄位 | 型別 | 約束 | 說明 |
|---|---|---|---|
| `discount_type` | text | NOT NULL, CHECK ∈ `buy_one_get_one / storewide_discount / in_store_spend_discount / spend_get_voucher / shipping_discount` | 買一送一／全館折扣／滿額折扣／滿額贈券／運費折抵 |

## 雙狀態機設計 + 生效開關（此表最特殊之處）

此表用**兩個獨立的「狀態欄位」**分別描述「發放面」與「使用面」的生命週期，
再各自搭配一組「生效開關（`xx_enable`）＋人工覆寫（`xx_manual`）」，取代舊版單一的 `coupon_disenable` 總開關。

設計動機：`state` 由系統依時間自動推算（無法/不該被人工亂改），但實務上仍需要「管理者臨時強制關閉」或「提前開放」的能力，
所以拆出 `xx_enable`（應用程式實際依據的唯一生效值）與 `xx_manual`（人工覆寫意圖，三態：`NULL`＝交給系統自動判斷／`true`／`false`＝人工鎖定）。

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `publish_status` | text | NOT NULL, CHECK ∈ `draft / claim_not_open / claim_open / claim_ended / suspended` | `'draft'` | 發放狀態：草稿 → 未開放領取 → 開放領取 → 領取結束 → 停用。由排程依 `claim_start_at`/`claim_end_at` 幂等更新，不接受人工直接改動 |
| `usability_status` | text | NOT NULL, CHECK ∈ `use_not_available / use_available / use_expired / use_used / suspended` | `'use_not_available'` | 使用狀態，同上邏輯，依 `valid_start_at`/`valid_end_at` 由排程幂等更新 |
| `claim_manual` | boolean | – | `NULL` | 領取面的人工覆寫意圖。`NULL`＝完全交給系統自動判斷；`true`/`false`＝管理者鎖定該值，修改此欄位當下會**立即同步**寫入 `claim_enable` |
| `claim_enable` | boolean | NOT NULL | `false` | 領取面**唯一的實際生效值**，應用程式判斷「現在能不能領券」只看這個欄位 |
| `usability_manual` | boolean | – | `NULL` | 使用面的人工覆寫意圖，規則同 `claim_manual` |
| `usability_enable` | boolean | NOT NULL | `false` | 使用面唯一的實際生效值，判斷「這張券現在能不能被使用」只看這個欄位 |

### `xx_enable` 與 `xx_manual` 的連動規則

| 觸發來源 | 條件 | 動作 |
|---|---|---|
| 管理者修改 `xx_manual` | 設成 `true` 或 `false`（非 `NULL`） | `xx_enable ← xx_manual`（立即同步） |
| 排程：起始時間到（`claim_start_at` / `valid_start_at`） | `xx_manual IS NULL` | `xx_enable ← true` |
| 排程：起始時間到 | `xx_manual IS NOT NULL` | 不動 `xx_enable`（尊重人工已鎖定的值） |
| 排程：結束時間到（`claim_end_at` / `valid_end_at`） | 不論 `xx_manual` 為何 | `xx_enable ← false`（強制關閉，`xx_manual` 本身不被重置） |

### 排程實作原則（寫給未來實作 pg_cron / Edge Function 的人）

**不要**把排程邏輯寫成「偵測到時間剛好跨過邊界那一刻才動作」（事件觸發式），因為排程若某次漏跑或延遲，那次轉換就永久錯過、之後也不會再補做。

**要**寫成**幂等（idempotent）**：每次排程執行都用「當下時間 vs 時間欄位」重新判斷該有的值，直接 `UPDATE ... WHERE` 條件收斂到正確狀態，不管中間跑了幾次、隔多久跑，結果都一樣。範例邏輯（僅供未來實作參考，非目前已套用的程式）：

```sql
-- 起始：時間到且未被人工鎖定 → 開
update coupon_templates
set claim_enable = true
where claim_manual is null
  and now() >= claim_start_at
  and now() < claim_end_at
  and claim_enable = false;

-- 結束：時間到 → 強制關（不論人工鎖定與否）
update coupon_templates
set claim_enable = false
where now() >= claim_end_at
  and claim_enable = true;

-- usability_enable / valid_start_at / valid_end_at 比照辦理
```

## 額度限制
| 欄位 | 型別 | 約束 | 說明 |
|---|---|---|---|
| `total_quota` | integer | NOT NULL, CHECK `>= -1` | `-1` 推測代表「無上限」的慣例值，而非真的允許負數 |
| `claim_limit` | integer | NOT NULL, CHECK `>= 1` | 每人可領取張數下限為 1 |

## 時效
| 欄位 | 型別 | 約束 | 說明 |
|---|---|---|---|
| `claim_start_at` / `claim_end_at` | timestamptz | NOT NULL | 領取期間，驅動 `publish_status` 與 `claim_enable` 的排程判斷 |
| `valid_start_at` / `valid_end_at` | timestamptz | NOT NULL | 使用有效期間，驅動 `usability_status` 與 `usability_enable` 的排程判斷（與領取期間分開，符合「領券」與「用券」時間可不同的常見電商邏輯）|

## 稽核欄位
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `created_by` | uuid | NOT NULL | – | 操作者。刻意**不加 FK**（即使概念上對應 `auth.users.id`），維持與其餘表一致的「無外鍵」設計 |
| `created_at` | timestamptz | NOT NULL | `now()` | – |

`updated_by`／`updated_at` 已移除：異動歷程改由獨立的審查日誌表記錄（見上方待辦，尚未建立）。

## RLS Policy（目標設計）

- **管理權限判定**：不使用 JWT custom claims，改用查表方式——`user_profiles` 增加 `admin_item`（`text[]`），存放「該用戶是哪些表的管理員」，例如 `admin_item = ['coupon_templates']`。原因：權限異動要即時生效（改了馬上生效，不用等使用者重新登入/refresh token），且目前規模小，多一次 join 查詢的效能成本可忽略。
- **寫入（INSERT / UPDATE）**：只允許 `admin_item` 包含 `'coupon_templates'` 的使用者，一般角色完全沒有對應 policy（無法寫入，非條件式限制）。
- **刪除**：暫不開放（沿用現況，無 DELETE policy）。
- **讀取（SELECT）**：一般角色（`anon`/`authenticated`）可讀，但**只能看部分欄位**——這不是 RLS（列級）能處理的範圍，改用 **column-level GRANT/REVOKE**：對公開欄位（如 `coupon_name`、`coupon_description`、`terms_and_conditions`、`coupon_code`、`discount_type`、`claim_enable`、`usability_enable`、時效欄位等）保留 SELECT 權限；對管理面欄位（`created_by`、`claim_manual`、`usability_manual`、`total_quota`、`claim_limit`、`publish_status`、`usability_status`）REVOKE 掉一般角色的 SELECT 權限。
  - 之所以選 column-level GRANT/REVOKE 而非另開 VIEW：需求單純（單表拿掉幾個管理欄位、不需 join/計算欄位），維護成本更低。

## 索引
`coupon_templates_pkey`（template_id）、`coupon_templates_coupon_code_key`（coupon_code unique）。
