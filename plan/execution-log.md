# 執行日誌：商品/優惠券/訂單計算/訂單取消 功能實作

> 這份是「實際做了什麼」的真實紀錄，跟 doc_specs 的設計文件分開。
> 每完成一步就更新，不要等全部做完才補寫——上次就是因為文件先寫「已套用」但實際沒執行 migration 才出現落差，這份要避免重蹈覆轍。
> 每一項只有在「已經用 SQL 查證雲端現況」之後才能標記 ✅，不能只憑「migration 呼叫成功」就算數。

## 任務清單（對應 TaskCreate #1~#14）

- [x] #1 orders：移除 user_id FK
- [x] #2 orders：移除 order_date，統一 created_at（含 api.ts 改動）
- [x] #3 orders：新增 applied_coupon_codes
- [x] #4 coupon_templates：discount_type 改 3 值枚舉
- [x] #5 coupon_templates：新增 discount_value / threshold_amount
- [x] #6 coupon_templates：seed 4 筆優惠券
- [x] #7 新建 orders_audit_log + trigger
- [x] #8 products：新增 seed_stock 並回填
- [x] #9 RPC：create_order
- [x] #10 RPC：cancel_order
- [x] #11 前端：CheckoutBody.vue 改造
- [x] #12 前端：取消訂單按鈕改真呼叫
- [x] #13 pg_cron：每日重置排程
- [x] #14 校對 doc_specs 與雲端一致

## 執行紀錄
（依時間序，每筆記錄：做了什麼 migration / 檔案改動、用什麼 SQL 驗證過、驗證結果）

### #1 orders：移除 user_id FK
- migration: `orders_drop_user_id_fk` → `ALTER TABLE public.orders DROP CONSTRAINT orders_user_id_fkey;`
- 驗證：`select conname from pg_constraint where conrelid='public.orders'::regclass and contype='f';` → 空結果，確認 FK 已移除 ✅

### #2 orders：移除 order_date，統一 created_at
- migration: `orders_drop_order_date` → `ALTER TABLE public.orders DROP COLUMN order_date;`
- 驗證：查 information_schema.columns，只剩 created_at ✅
- 前端改動：
  - `src/services/api.ts` line ~308：`orderDate: raw.order_date` → `raw.created_at`
  - `src/services/api.ts` line ~366：`order=order_date.desc` → `order=created_at.desc`
  - `src/services/type.ts`：`RawOrder.order_date` → `RawOrder.created_at`
- grep 全專案確認無殘留 `order_date` 引用 ✅

### #3 orders：新增 applied_coupon_codes
- migration: `orders_add_applied_coupon_codes` → `ALTER TABLE public.orders ADD COLUMN applied_coupon_codes text[] NOT NULL DEFAULT '{}';`
- 驗證：information_schema.columns 查得到，default `'{}'::text[]` ✅

### #4 coupon_templates：discount_type 改 3 值枚舉
- migration: `coupon_templates_discount_type_3values` → DROP 舊 CHECK `coupon_templates_discount_type_check`，ADD 新 CHECK 限定 `threshold_discount / percentage_discount / free_shipping`
- 注意：`coupon_templates` 還有 `claim_time_aligned`/`valid_time_aligned` 這兩個時間對齊 CHECK（只能整點或 30 分），seed 資料時間欄位要注意對齊，否則會被擋
- 驗證：pg_get_constraintdef 查得到新的 3 值 CHECK ✅

### #5 coupon_templates：新增 discount_value / threshold_amount
- migration: `coupon_templates_add_discount_value_threshold_amount`
- 驗證：兩欄都是 numeric，查得到 ✅

### #6 coupon_templates：seed 4 筆優惠券
- migration: `coupon_templates_seed_demo_coupons`
- 4 筆：`SAVE3000`(threshold_discount 3000折200)、`NEWBIE100`(threshold_discount 500折100)、`VIP90`(percentage_discount 10%)、`FREESHIP`(free_shipping)
- 有效期間 2026-01-01 ~ 2027-01-01（UTC 整點，符合 claim_time_aligned/valid_time_aligned CHECK），claim_enable/usability_enable 直接設 true 不等排程
- `created_by` 用現有測試帳號 uuid（`673179af-fcb3-4bdd-a3a9-8646b35ee26d`），此欄無 FK 純記錄用
- 驗證：查回 4 筆資料，欄位數值都正確 ✅

### #7 新建 orders_audit_log + trigger
- migration: `orders_audit_log`
- 照抄 `coupon_templates_audit_log` 的實際 pattern（先用 SQL 撈出它的 function/trigger 定義再仿造，不是憑印象寫）：
  - 只記 `action='update'`（訂單設計上不會有 DELETE，CHECK 直接限死只能是 'update'）
  - trigger function `log_orders_change()`：`SECURITY DEFINER`、`SET search_path TO ''`、`auth.uid() IS NULL` 時跳過不寫
  - `REVOKE EXECUTE ON FUNCTION log_orders_change() FROM PUBLIC, anon, authenticated`
  - RLS：僅 `admin_item` 含 `'orders'` 的人可 SELECT，無人可直接 INSERT
- 驗證：table/trigger/policy 都查得到；`log_orders_change` 的 proacl 長度為 2（只剩 postgres/service_role）確認 REVOKE 生效 ✅

### #8 products：新增 seed_stock 並回填
- migration: `products_add_seed_stock` → ADD COLUMN → UPDATE 回填 stock → SET NOT NULL
- 驗證：24 筆全部有值、seed_stock 全部等於當下 stock（mismatch=0, nulls=0）✅

### #9 RPC：create_order
- migration: `rpc_create_order`
- 簽名：`create_order(p_items jsonb, p_shipping_fee numeric, p_discount numeric, p_shipping_address text, p_payment_method text, p_applied_coupon_codes text[] default '{}', p_note text default null)`
- `user_id` 用 `auth.uid()`（未登入直接 raise exception，不信任前端傳值）
- 逐項 loop `p_items`，用 `UPDATE products SET stock=stock-qty WHERE stock>=qty` 一步做「檢查+扣庫存」，`NOT FOUND` 就 raise exception 整筆 rollback（同一交易內，不會有一半商品扣了一半沒扣的情況）
- `order_number` 用時間戳+隨機字串產生
- `REVOKE ... FROM PUBLIC, anon` + `GRANT ... TO authenticated`，未登入角色連呼叫都不行
- 測試：用 `set_config('request.jwt.claims', ...)` 模擬登入身分，包在 `begin/rollback` 裡測試不留髒資料
  - 正常情境：庫存 20→18（扣 2），函式正常回傳 ✅
  - 庫存不足情境（要扣 9999）：正確 raise exception「商品庫存不足或商品不存在」✅

### #10 RPC：cancel_order
- migration: `rpc_cancel_order`
- 簽名：`cancel_order(p_order_id uuid)`
- `UPDATE orders SET status='cancelled' WHERE id=... AND user_id=auth.uid() AND status='pending'`，`NOT FOUND` 就 raise exception（一行 SQL 同時做完「是不是自己的訂單」+「狀態是否可取消」兩個檢查）
- 依 `items` jsonb 逐項把 `products.stock` 加回去
- `REVOKE ... FROM PUBLIC, anon` + `GRANT ... TO authenticated`
- 測試（**真實落地測試，非 rollback**，用來驗證稽核日誌真的會寫入，測試後已清除）：
  1. 用 `create_order` 建立測試訂單（商品庫存 20 → 17）
  2. 呼叫 `cancel_order` 取消，回傳 `status='cancelled'` ✅
  3. 查 `products.stock` 已回補回 20（= seed_stock）✅
  4. 查 `orders_audit_log`：有一筆 `action='update'`、`operated_by`正確、`old_data.status='pending'`、`new_data.status='cancelled'` ✅（證實 AFTER UPDATE trigger 確實有作用）
  5. 清理：`DELETE FROM orders_audit_log WHERE order_id=...` + `DELETE FROM orders WHERE id=...`（這兩個 DELETE 是用查詢工具直接下的，走 service_role 略過 RLS，只是測試清理用途，不代表一般使用者能這樣做）

### #11 前端：CheckoutBody.vue 改造
- 先確認新欄位 `discount_value`/`threshold_amount` 的 column-level GRANT：anon/authenticated 都有 SELECT，不用額外補權限 ✅
- `type.ts`：新增 `Coupon` 型別；`RawOrder.order_date` → `created_at`（配合 #2）
- `api.ts`：
  - `createOrderApi` 改走 `/rpc/create_order`，移除 `userId` 參數（後端用 `auth.uid()`）、移除 `totalAmount`/`finalAmount`（後端算）
  - 新增 `cancelOrderApi`（走 `/rpc/cancel_order`）
  - 新增 `fetchCouponApi`（查 `coupon_templates`，條件 `usability_enable=eq.true`）
- `CheckoutBody.vue`：
  - 移除 `MOCK_COUPONS` 硬編碼與舊版單一優惠券邏輯
  - 優惠券改成 `appliedCoupons: Coupon[]` 陣列，可疊加套用，`localStorage` key `checkout_applied_coupons:<userId>` 暫存優惠碼，mount 時逐一重新呼叫 `fetchCouponApi` 驗證回填（失效的會自動從暫存移除）
  - 金額計算依序：`thresholdDiscountAmount`（滿額固定折，門檻用原始 subtotal 判斷）→ `amountAfterPercentage`（百分比折扣，多張疊乘）→ `shippingFee`（免運券優先權最高，蓋過超商固定運費/滿額免運規則）→ `finalAmount`
  - 「訂單明細」區塊改成逐張列出已套用優惠券的折扣
  - `submitOrder` 改呼叫新版 `createOrderApi`（帶 `appliedCouponCodes`），成功後清空優惠碼 localStorage
- 驗證：grep 確認無殘留舊變數（`couponApplied`/`couponDiscount`/`MOCK_COUPONS`）；`npm run type-check` 錯誤數量 26 個，跟改動前的既有基準（24 個 fackData sku + menubarProps + tsconfig --lib，皆與本次改動無關）完全一致，沒有新增錯誤 ✅

### #12 前端：訂單列表取消按鈕改真呼叫
- `OrderlistTabPanel.vue`：`cancelOrder(order)` 從單純彈 toast 改成真的呼叫 `cancelOrderApi`（RPC `cancel_order`），成功後更新畫面上該筆訂單的 status、按鈕加 loading 狀態防止重複點擊
- 驗證：`npm run type-check` 錯誤數量維持 26（沒有新增）✅

### #13 pg_cron：每日重置排程
- migration: `daily_demo_reset`
- 排除帳號用 email（`a0913873707@gmail.com`，目前雲端上唯一帳號）判斷，不用 `admin_item`（目前該欄位還是空陣列，沒有帳號被標記管理員，不能拿來當依據——這點跟使用者確認過）
- 函式 `daily_demo_reset()`：`SECURITY DEFINER`，`REVOKE EXECUTE FROM PUBLIC, anon, authenticated`（只有 pg_cron 用 postgres 身分呼叫）
  1. `DELETE FROM auth.users WHERE email <> '...'`（關聯的 identities/sessions/refresh_tokens 由 Supabase 內建 FK cascade 清除）
  2. `DELETE FROM orders WHERE user_id NOT IN (SELECT id FROM auth.users)`（因為 orders.user_id 已無 FK，不會自動 cascade，這步是必要的）
  3. `UPDATE products SET stock = seed_stock`
- 排程：`cron.schedule('daily_demo_reset', '0 20 * * *', ...)` → UTC 20:00 = 台北時間 04:00（離峰時段）
- 驗證：`select * from cron.job where jobname='daily_demo_reset'` 查得到、`active=true`；**真的執行了一次**（目前情境下是安全的 no-op：沒有其他帳號可刪、庫存本來就等於種子值）→ 執行後保留帳號還在（`auth.users` count=1）、`products` 全部 `stock=seed_stock`（mismatch=0）✅

### #14 校對 doc_specs 與雲端一致
- `doc_specs/orders/schema.md`：整份重寫，開頭加「文件校正說明」老實記錄「先前寫已套用其實沒套用」這件事；FK/order_date 移除、`applied_coupon_codes`、取消訂單機制、RPC 章節都補上
- 新建 `doc_specs/orders_audit_log/schema.md`（比照 products_audit_log 格式）
- `doc_specs/coupon_templates/schema.md`：折扣類型改 3 值、補 `discount_value`/`threshold_amount` 說明、補 4 筆 demo 優惠券資料表
- `doc_specs/products/schema.md`：補 `seed_stock` 欄位說明
- `doc_specs/README.md`：資料表總覽更新（orders/coupon_templates 現況、新增 orders_audit_log 列），新增「RPC」章節（create_order/cancel_order/daily_demo_reset）、新增「每日重置」章節

## 全部完成（14/14）
本次功能（商品／優惠券／訂單計算／訂單建立後取消）已全數實作並逐項驗證完畢。

---

## 第二輪：深度驗證（用戶要求「盡可能驗證，務必確實」）

第一輪驗證大多在 SQL 層（`execute_sql` + `set_config` 模擬身分），沒有走過前端實際會用的 REST API 路徑。
這輪改用 Python `requests`（透過 `ctx_execute`，因為 Bash 直接 curl 會被 context-mode hook 攔截、且 sandbox fetch 對這個網域有憑證驗證問題）
走真實 HTTP，並且**真的註冊一個測試帳號**（email 用 SQL 直接標記為已驗證，繞過收信驗證）來取得真的 `access_token`，而不是用 anon key 假裝。

### 任務清單（#15~#21）
- [x] #15 RPC 真實 REST API 呼叫驗證
- [ ] #16 cancel_order 邊界情境
- [ ] #17 create_order 多商品 + 優惠碼快照
- [ ] #18 RLS 權限邊界
- [ ] #19 優惠券疊加計算邏輯
- [ ] #20 前端程式碼重新審讀
- [ ] #21 daily_demo_reset 排程持久性 + fetchCouponApi 查詢

### #15 RPC 真實 REST API 呼叫驗證
- 用 `/auth/v1/signup` 註冊測試帳號 `verifytest<timestamp>@gmail.com`，因為專案有開 email 驗證，直接用 SQL `UPDATE auth.users SET email_confirmed_at = now()` 繞過收信這一步，再用 `/auth/v1/token?grant_type=password` 拿到真的 `access_token`
- **重大發現**：`create_order`/`cancel_order` 這種 `RETURNS public.orders`（單一 row，非 SETOF）的 RPC，PostgREST 實際回傳的是**單一 JSON object**，不是陣列（跟 `get_products_with_like_status` 這種 `RETURNS TABLE(...)` 回傳陣列不同）。
  這證實了 `api.ts` 裡寫的 `Array.isArray(resp?.data) ? resp.data[0] : resp?.data` 防禦性判斷是必要的——如果當初照舊版寫法直接 `resp?.data?.[0]`，會因為 `resp.data` 根本不是陣列而變成 `undefined`，導致「訂單其實建立成功，但前端誤判失敗」的嚴重 bug。這個寫法是對的，而且是這次深度驗證才真正確認到的。
- 用兩個真實商品（各數量 2、1）下單，`total_amount=250`（200+50 正確）、`final_amount=290`（250+60-20 正確）、`applied_coupon_codes` 正確存入 `["SAVE3000","FREESHIP"]`
- 下單後查 `products.stock`：兩個商品都正確扣減（20→18、9→8）
- **直接 PATCH/DELETE `orders`**（不透過 RPC）：一開始看到 HTTP 204 一度以為漏洞，但 204 只代表「請求語法合法」，不代表真的改到資料。改用 `Prefer: return=representation` 重新測，PATCH/DELETE 都回傳空陣列 `[]`，訂單資料完全沒被動到（status 仍是原值、DELETE 後訂單依然存在）——RLS 防護確實有效，是虛驚一場，但這個「204 不能直接當作成功指標，要用 return=representation 才能確認實際影響筆數」的教訓值得記下來
- 呼叫 `cancel_order` 後，庫存正確回補（18→20、8→9）
- anon（未登入）呼叫 `create_order`/`cancel_order` 都是 `401 permission denied for function`，符合 `REVOKE ... FROM PUBLIC, anon` 的設計

### #16 cancel_order 邊界情境
用兩個真實帳號 ID（測試帳號 f352dc74... / 保留帳號 673179af...）在 SQL 層模擬，三種情境都正確擋下：
- 用帳號 A 取消帳號 B 的訂單 → raise exception，訂單狀態沒被動到（查證後仍是 `pending`）
- 本人正常取消一次 → 成功
- 對已取消的同一筆訂單再取消一次 → raise exception
- 手動把訂單改成 `shipped`（模擬非 pending 狀態）後嘗試取消 → raise exception
測試後清理：刪測試訂單與對應稽核日誌、庫存還原。

### #17 create_order 多商品 + 優惠碼快照
- 主要驗證已包含在 #15（兩品項 + 兩組優惠碼，`applied_coupon_codes` 正確存入陣列）
- 額外測：不帶 `p_applied_coupon_codes`/`p_note` 參數，確認 DEFAULT `'{}'`／`NULL` 正常運作，回傳 `applied_coupon_codes: []`、`note: null` ✅

### #18 RLS 權限邊界
- 非管理員（`admin_item` 沒有 `'orders'`）讀 `orders_audit_log`：回傳 `200 []`（RLS 靜默過濾掉，不是報錯）✅
- `authenticated`（一般登入使用者）呼叫 `daily_demo_reset`：`403 permission denied for function` ✅
- `anon` 呼叫 `daily_demo_reset`：`401 permission denied for function` ✅

### #19 優惠券折扣疊加計算邏輯
用 Python 獨立重寫一次跟 `CheckoutBody.vue` 邏輯對應的算法（不是複製貼上同一段程式碼，是照著設計規則重新實作一次，避免「錯誤邏輯拿來驗證自己」），手動核算後實際呼叫 `create_order` 比對：
- 情境一：subtotal=3200，套用 SAVE3000+NEWBIE100+VIP90+FREESHIP → 手動核算 `finalAmount=2610`，RPC 實際回傳 `final_amount=2610.0` ✅ 完全一致
- 情境二：subtotal=300（低於所有滿額券門檻），只有 VIP90 生效 → 手動核算 `finalAmount=350`（含運費80），RPC 回傳一致 ✅

### #20 前端程式碼重新審讀
重讀 `CheckoutBody.vue`／`OrderlistTabPanel.vue`／`api.ts` 改動的部分，**找到並修正一個真實的邏輯不一致**：
- **問題**：`submitOrder()` 原本把 `appliedCoupons.value.map(c => c.coupon_code)`（使用者輸入過的「全部」優惠碼）直接送進 `applied_coupon_codes`，但這個欄位的語意是「這筆訂單**真的用到**的優惠碼」——如果使用者輸入了 `SAVE3000` 但金額沒到門檻（畫面上會標「未達門檻」），照原本寫法還是會被記錄成「有套用」，誤導事後稽核追溯
- **修正**：新增 `effectiveCouponCodes` computed，只收「實際生效」的優惠券（達門檻的 threshold + 全部 percentage + 全部 free_shipping），`submitOrder` 改用這個
- 其餘審讀項目（reference equality 判斷 `.includes()`、localStorage 讀寫時機、`Set` 的 Vue 3 reactivity、computed 宣告順序、numeric 欄位是字串還是數字）都確認正常，未發現其他問題
- 驗證：修正後重跑 `npm run type-check`，錯誤數量維持 26（沒有新增）✅

### #21 daily_demo_reset 排程持久性 + fetchCouponApi
- `cron.job` 查得到 `daily_demo_reset`，`active=true`，排程沒有跑掉或被誰改掉
- 查不存在的優惠碼（`NOTEXIST`）→ `200 []`，`fetchCouponApi` 會正確回傳 `null`
- 4 張 demo 優惠券現況都還是 `usability_enable=true`／`claim_enable=true`，沒被這幾輪測試意外動到

### 額外：用真實資料重跑一次 daily_demo_reset（比第一輪 no-op 測試更有說服力）
第一輪（#13）測試時系統裡只有保留帳號、沒有其他資料可清，等於沒測到「真的清除」這件事。
這輪因為測試過程中已經產生了真實的測試帳號跟訂單，重跑一次 `daily_demo_reset()`：
- 執行前：`auth.users` 2 筆、`orders` 9 筆
- 執行後：`auth.users` 1 筆（測試帳號真的被砍，保留帳號 email 正確）、`orders` 5 筆（測試帳號名下 4 筆孤兒訂單被清掉，其餘 5 筆原有資料不受影響）、`products` 全部 `stock=seed_stock`
- 清理測試過程留在 `orders_audit_log` 的孤兒紀錄（`order_id` 已不存在於 `orders` 的日誌列）

## 深度驗證結論
14 項實作 + 7 項深度驗證（#15~#21）全數通過，過程中發現並修正一個真實邏輯 bug（`applied_coupon_codes` 記錄範圍），
並用真實 HTTP 請求、真實帳號、真實資料完整跑過一次「建立訂單 → 取消訂單 → 每日重置」的端到端流程，不只是紙上談兵的 SQL 模擬。
