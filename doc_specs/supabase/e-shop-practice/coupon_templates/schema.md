# coupon_templates（優惠券範本）

> ✅ 本文件記錄的設計**已套用到雲端 Supabase**（migration: `coupon_templates_redesign_and_admin_item`、`fix_uuidv7_search_path`；`discount_type` 改 3 值枚舉、新增 `discount_value`/`threshold_amount`、seed 4 筆 demo 資料為本次新增，migration: `coupon_templates_discount_type_3values`、`coupon_templates_add_discount_value_threshold_amount`、`coupon_templates_seed_demo_coupons`）。

套用時額外發現並清理的舊物件（文件先前未記錄到）：
- Trigger `trigger_disenable_to_suspended`＋其函式 `sync_disenable_to_suspended()`：依賴已移除的 `coupon_disenable`，已一併刪除。
- Trigger `update_coupon_templates_updated_at`：依賴已移除的 `updated_at`，已刪除（底層函式 `update_updated_at_column()` 仍被 `site_config` 共用，未刪除）。
- 函式 `auto_update_publish_status()`：查證後目前沒有任何 trigger 掛載它，是孤兒函式，已刪除。


PK: `template_id`（設計與排程已完整套用並驗證，目前 4 筆 demo 資料，見下方「Demo 優惠券資料」）

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 基本資訊
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
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

## 折扣類型與折扣數值

> ✅ 已重新設計（migration: `coupon_templates_discount_type_3values`、`coupon_templates_add_discount_value_threshold_amount`）：原本 5 種枚舉值移除，改成對應 demo 情境的 3 種；新增 `discount_value`/`threshold_amount` 兩欄存實際數字，不再需要額外的「折扣模式」欄位——`discount_type` 本身就足以判斷 `discount_value` 該怎麼解讀。

| 欄位 | 型別 | 約束 | 備註 |
|---|---|---|---|
| `discount_type` | text | NOT NULL, CHECK ∈ `threshold_discount / percentage_discount / free_shipping` | `threshold_discount`＝滿額折固定金額；`percentage_discount`＝打折；`free_shipping`＝免運費 |
| `discount_value` | numeric | – | 依 `discount_type` 解讀：`threshold_discount` 是折掉的金額；`percentage_discount` 是折掉的百分比（例如 `10` 代表打 9 折）；`free_shipping` 用不到，為 NULL |
| `threshold_amount` | numeric | – | 門檻金額，判斷基準是「原始商品小計」（非疊加其他折扣後的金額）。`percentage_discount`／`free_shipping` 沒有門檻概念，為 NULL |

### Demo 優惠券資料（✅ 已 seed，migration: `coupon_templates_seed_demo_coupons`）

| coupon_code | coupon_name | discount_type | threshold_amount | discount_value |
|---|---|---|---|---|
| `SAVE3000` | 全館滿3000折200 | threshold_discount | 3000 | 200 |
| `NEWBIE100` | 新會員折100 | threshold_discount | 500 | 100 |
| `VIP90` | 最終9折 | percentage_discount | – | 10 |
| `FREESHIP` | 免運費 | free_shipping | – | – |

四張可同時疊加套用，前端結帳頁固定依序套用：`threshold_discount` → `percentage_discount` → `free_shipping`，詳見 `CheckoutBody.vue` 的金額計算區塊。

## 雙狀態機設計 + 生效開關（此表最特殊之處）

此表用**兩個獨立的「狀態欄位」**分別描述「發放面」與「使用面」的生命週期，
再各自搭配一組「生效開關（`xx_enable`）＋人工覆寫（`xx_manual`）」，取代舊版單一的 `coupon_disenable` 總開關。

設計動機：`state` 由系統依時間自動推算（無法/不該被人工亂改），但實務上仍需要「管理者臨時強制關閉」或「提前開放」的能力，
所以拆出 `xx_enable`（應用程式實際依據的唯一生效值）與 `xx_manual`（人工覆寫意圖，三態：`NULL`＝交給系統自動判斷／`true`／`false`＝人工鎖定）。

| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `publish_status` | text | NOT NULL, CHECK ∈ `draft / claim_not_open / claim_open / claim_ended / suspended` | `'draft'` | 發放狀態。`draft`/`suspended` 只能人工設定，排程不會碰；一旦人工設成 `claim_not_open`，之後 `claim_not_open → claim_open → claim_ended` 這段轉移**由排程依 `claim_start_at`/`claim_end_at` 幂等更新**（✅ 已套用，見下方「排程實作」） |
| `usability_status` | text | NOT NULL, CHECK ∈ `use_not_available / use_available / use_expired / use_used / suspended` | `'use_not_available'` | 使用狀態，`use_used`/`suspended` 只能人工設定；`use_not_available → use_available → use_expired` 由排程依 `valid_start_at`/`valid_end_at` 幂等更新（✅ 已套用） |
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

### 排程實作（✅ 已套用到雲端）

用 `pg_cron`（已裝好的 extension，schema 在 `pg_catalog`，Supabase Dashboard 的 Extensions 頁面只負責開關，實際操作都是純 SQL）建立 job：`coupon_templates_sync_enable`，排程 `1,31 * * * *`（每小時的 01 分與 31 分執行）。

邏輯採**幂等（idempotent）**寫法：每次執行都用「當下時間 vs 時間欄位」重新判斷該有的值，不偵測「跨越瞬間」，避免排程漏跑或延遲時永久錯過某次轉換：

```sql
-- 起始：時間到且未被人工鎖定 → 開
update coupon_templates set claim_enable = true
  where claim_manual is null and now() >= claim_start_at and now() < claim_end_at and claim_enable = false;

-- 結束：時間到 → 強制關（不論人工鎖定與否）
update coupon_templates set claim_enable = false
  where now() >= claim_end_at and claim_enable = true;

-- usability_enable / valid_start_at / valid_end_at 比照辦理
update coupon_templates set usability_enable = true
  where usability_manual is null and now() >= valid_start_at and now() < valid_end_at and usability_enable = false;

update coupon_templates set usability_enable = false
  where now() >= valid_end_at and usability_enable = true;

-- publish_status / usability_status：draft、suspended、use_used 是人工專屬狀態，
-- WHERE 條件只匹配自動循環中的狀態值，天然排除人工狀態，不需要額外的 manual 欄位
update coupon_templates set publish_status = 'claim_open'
  where publish_status = 'claim_not_open' and now() >= claim_start_at and now() < claim_end_at;

update coupon_templates set publish_status = 'claim_ended'
  where publish_status in ('claim_not_open', 'claim_open') and now() >= claim_end_at;

update coupon_templates set usability_status = 'use_available'
  where usability_status = 'use_not_available' and now() >= valid_start_at and now() < valid_end_at;

update coupon_templates set usability_status = 'use_expired'
  where usability_status in ('use_not_available', 'use_available') and now() >= valid_end_at;
```

**為什麼是 `1,31` 而不是每分鐘**：因為下方新增了「時間對齊 CHECK」，強制 `claim_start_at`/`claim_end_at`/`valid_start_at`/`valid_end_at` 只能落在整點或 30 分，所以檢查點只要設在邊界之後 1 分鐘（`:01`／`:31`）就能維持約 1 分鐘的反應延遲，同時把 `cron.job_run_details` 的成長量從「每分鐘」降到 1/30，減輕 Supabase 免費方案 500MB 資料庫容量的壓力。

**代價／風險**：如果時間欄位不慎寫入非整點/30分的值，CHECK 會直接擋掉（見下方），所以理論上不會發生「排程抓不到」的情況；但如果之後放寬 CHECK 或繞過（例如用 service_role 直接寫），幂等邏輯仍會在下一次 `:01`/`:31` 抓到，只是延遲可能拉長到最多 29 分鐘，不會報錯、也不會有任何提示，算是一種「悄悄劣化」的風險，需要之後留意。

另外同時建立了 `cleanup_cron_job_run_details` job（每天 03:00 執行），清掉 7 天前的 `cron.job_run_details` 執行紀錄，避免免費方案容量被排程執行紀錄慢慢吃掉。

**⚠️ 已知歷史問題（已排除）**：雲端上原本還有一個舊的 `auto-update-publish-status` job（`0 * * * *`，呼叫 `SELECT auto_update_publish_status();`），這個函式在整理 `coupon_templates_audit_log` 時被誤判為孤兒函式而刪除（只查了 `pg_trigger` 依賴，沒查 `cron.job`），導致這個 job 之後每小時執行都報錯。已用 `cron.unschedule()` 把這個 job 整筆刪除（`cron.job` 裡的紀錄跟著消失，不是只停用），並清掉它累積的 1,223 筆 `cron.job_run_details` 歷史紀錄。這個 job 原本負責的功能，已經被上面補齊的 `publish_status`/`usability_status` 邏輯取代。

**驗證方式**：曾用一筆測試資料（`template_id = '00000000-0000-0000-0000-0000000000aa'`）手動執行過與此 job 完全相同的 8 段 SQL，驗證過三種情境後即刪除測試資料，不影響正式資料：
1. 領取/使用期間「進行中」→ `publish_status/usability_status` 正確變成 `claim_open`/`use_available`，`claim_enable`/`usability_enable` 正確變成 `true`
2. 期間「已結束」→ 正確變成 `claim_ended`/`use_expired`，兩個 `enable` 正確變回 `false`，且過程未觸發任何 `NOT NULL` 報錯（證實排程情境下稽核 trigger 的跳過邏輯有效）
3. 模擬「有登入者身分」去更新資料列 → 稽核日誌正確記錄 `action = 'update'` 與正確的異動前後快照；模擬「無身分」（等同排程情境）去更新 → 稽核日誌**沒有**任何新紀錄，符合設計預期

### 時間對齊 CHECK（✅ 已套用）

```sql
alter table coupon_templates
  add constraint claim_time_aligned check (
    extract(minute from claim_start_at at time zone 'utc') in (0, 30)
    and extract(second from claim_start_at at time zone 'utc') = 0
    and extract(minute from claim_end_at at time zone 'utc') in (0, 30)
    and extract(second from claim_end_at at time zone 'utc') = 0
  ),
  add constraint valid_time_aligned check (
    extract(minute from valid_start_at at time zone 'utc') in (0, 30)
    and extract(second from valid_start_at at time zone 'utc') = 0
    and extract(minute from valid_end_at at time zone 'utc') in (0, 30)
    and extract(second from valid_end_at at time zone 'utc') = 0
  );
```

強制以 UTC 為基準（`at time zone 'utc'`），不受連線 session 的 timezone 設定影響，確保跟 pg_cron 排程判斷用的是同一套時間基準。這代表**後台建立/編輯優惠券範本的介面，時間欄位要限制使用者只能選整點或 30 分**，否則 API 寫入會直接被 CHECK 擋掉。

## 額度限制
| 欄位 | 型別 | 約束 | 備註 |
|---|---|---|---|
| `total_quota` | integer | NOT NULL, CHECK `>= -1` | `-1` 推測代表「無上限」的慣例值，而非真的允許負數 |
| `claim_limit` | integer | NOT NULL, CHECK `>= 1` | 每人可領取張數下限為 1 |

## 時效
| 欄位 | 型別 | 約束 | 備註 |
|---|---|---|---|
| `claim_start_at` / `claim_end_at` | timestamptz | NOT NULL | 領取期間，驅動 `publish_status` 與 `claim_enable` 的排程判斷 |
| `valid_start_at` / `valid_end_at` | timestamptz | NOT NULL | 使用有效期間，驅動 `usability_status` 與 `usability_enable` 的排程判斷（與領取期間分開，符合「領券」與「用券」時間可不同的常見電商邏輯）|

## 稽核欄位
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `created_by` | uuid | NOT NULL | – | 操作者。刻意**不加 FK**（即使概念上對應 `auth.users.id`），維持與其餘表一致的「無外鍵」設計 |
| `created_at` | timestamptz | NOT NULL | `now()` | – |

`updated_by`／`updated_at` 已移除：異動歷程改由獨立的審查日誌表 `coupon_templates_audit_log` 記錄（見下方「審查日誌」章節）。

## RLS Policy（✅ 已套用）

- **管理權限判定**：不使用 JWT custom claims，改用查表方式——`user_profiles` 增加 `admin_item`（`text[]`），存放「該用戶是哪些表的管理員」，例如 `admin_item = ['coupon_templates']`。原因：權限異動要即時生效（改了馬上生效，不用等使用者重新登入/refresh token），且目前規模小，多一次 join 查詢的效能成本可忽略。
- **寫入（INSERT / UPDATE）**：只允許 `admin_item` 包含 `'coupon_templates'` 的使用者，一般角色完全沒有對應 policy（無法寫入，非條件式限制）。
- **刪除**：改為開放給管理員（`admin_item` 含 `'coupon_templates'`），原本沒有 DELETE policy，補上是為了讓下方的審查日誌對「刪除」這件事有意義（否則管理員根本刪不了，日誌永遠不會有 delete 紀錄）。
- **讀取（SELECT）**：一般角色（`anon`/`authenticated`）可讀，但**只能看部分欄位**——這不是 RLS（列級）能處理的範圍，改用 **column-level GRANT/REVOKE**：對公開欄位（如 `coupon_name`、`coupon_description`、`terms_and_conditions`、`coupon_code`、`discount_type`、`claim_enable`、`usability_enable`、時效欄位等）保留 SELECT 權限；對管理面欄位（`created_by`、`claim_manual`、`usability_manual`、`total_quota`、`claim_limit`、`publish_status`、`usability_status`）REVOKE 掉一般角色的 SELECT 權限。
  - 之所以選 column-level GRANT/REVOKE 而非另開 VIEW：需求單純（單表拿掉幾個管理欄位、不需 join/計算欄位），維護成本更低。

## 索引
`coupon_templates_pkey`（template_id）、`coupon_templates_coupon_code_key`（coupon_code unique）。

## 審查日誌：`coupon_templates_audit_log`

只記錄**有權限的使用者對本表做 UPDATE／DELETE** 的操作（INSERT 不記錄，因為新增本身沒有「異動前狀態」可比對）。

| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `log_id` | uuid | PK, NOT NULL | `uuidv7()` | 日誌主鍵，用 v7 讓日誌天然依時間排序，方便分頁查詢 |
| `template_id` | uuid | NOT NULL | – | 對應的優惠券範本，刻意不加 FK：若原始資料列被刪除，FK 會讓日誌本身也連帶失效或需要 CASCADE，違背「日誌要在資料被刪後仍可查」的目的 |
| `action` | text | NOT NULL, CHECK ∈ `update / delete` | – | 這筆日誌是哪種操作產生的 |
| `operated_by` | uuid | NOT NULL | – | 操作者 `auth.uid()`，同樣刻意不加 FK，維持全專案一致的「不加外鍵」設計 |
| `operated_at` | timestamptz | NOT NULL | `now()` | 操作發生時間 |
| `old_data` | jsonb | NOT NULL | – | 異動前整列資料快照 |
| `new_data` | jsonb | – | – | 異動後整列資料快照；`action = 'delete'` 時必為 NULL（已經沒有「之後」的狀態） |

### 記錄機制

用 `AFTER UPDATE OR DELETE` trigger（`trigger_log_coupon_templates_change`）呼叫 `SECURITY DEFINER` 函式 `log_coupon_templates_change()` 寫入日誌，不透過應用層手動寫入，避免漏記。

- 因為觸發本表的 UPDATE/DELETE 本來就限定只有管理員（見上方 RLS），所以「有權限的使用者操作才留紀錄」這件事，其實是靠 `coupon_templates` 本身的 RLS 把關，日誌 trigger 本身不用重複判斷身分。
- `log_coupon_templates_change()` 用 `SECURITY DEFINER` 是因為稽核表本身刻意不開放任何角色直接寫入（見下方），一般權限寫不進去，所以要讓 trigger 用「建立者權限」寫入，繞過稽核表自身的 RLS。
- 已額外 `REVOKE EXECUTE` 掉 `anon`/`authenticated`/`public` 對這個函式的直接呼叫權限——否則 Supabase 會把它自動曝露成 `/rest/v1/rpc/log_coupon_templates_change`，任何人都能直接呼叫塞假資料進日誌，這點在套用時被 Supabase security advisor 抓出來並已修正。trigger 本身的觸發不受此限制（觸發機制不需要呼叫端具備 EXECUTE 權限）。
- **`auth.uid() IS NULL` 時直接跳過、不寫日誌**：這是為了搭配下方「排程」機制而補的修正。`pg_cron` 執行 SQL 時沒有 JWT context，`auth.uid()` 會是 `NULL`，若無條件寫日誌，會因為 `operated_by` 是 `NOT NULL` 而報錯，導致排程的 UPDATE 整個失敗。這個判斷同時也讓日誌語意更精準：系統自動排程改的值不算「使用者操作」，本來就不該被記錄。

### RLS Policy

- **SELECT**：只有管理員（`admin_item` 含 `'coupon_templates'`）可讀。
- **INSERT／UPDATE／DELETE**：任何角色都沒有 policy，一般人與管理員都無法直接寫入這張日誌表，唯一寫入路徑是上面的 trigger（用 `SECURITY DEFINER` 繞過）。這樣可以保證日誌本身不會被使用者竄改。

### 索引
`coupon_templates_audit_log_template_id_idx`（template_id），方便依範本查詢異動歷史。
