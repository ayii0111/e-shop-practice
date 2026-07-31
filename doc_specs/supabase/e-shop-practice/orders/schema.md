# orders（訂單）

> ⚠️ **文件校正說明**：本文件先前版本寫著「✅ 已移除 `user_id` FK 與重複的 `created_at`」，但當時**只是設計提案，從未真的執行對應的 migration**——
> 這點是靠重新核對雲端 migration 清單（`mcp__supabase__list_migrations`）才發現的，文件敘述跟雲端實際狀態不一致。
> 現在（本次改動後）這些提案**才真的套用了**，見下方各節標註的 migration 名稱；以後任何「✅ 已套用」的標記都必須是查過 migration 清單或直接查 schema 驗證過，不能只憑討論結論就寫。

PK: `id`

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 識別 / 歸屬
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | 主鍵，不對外曝光的內部技術鍵 |
| `user_id` | uuid | NOT NULL | – | 下單用戶。✅ **FK 已移除**（migration: `orders_drop_user_id_fk`），理由見下方「刪除 FK 的理由」 |
| `order_number` | text | NOT NULL, UNIQUE | – | 對外顯示/客服對帳用的訂單編號，由 `create_order` RPC 產生（時間戳 + 隨機字串） |
| `applied_coupon_codes` | text[] | NOT NULL | `'{}'` | ✅ 新增（migration: `orders_add_applied_coupon_codes`）：記錄這筆訂單實際套用了哪些優惠碼，下單當下的快照，供事後追溯「這張券真的有被用到」 |

### 刪除 FK 的理由（✅ 已套用）
`user_id → auth.users.id` 這條 FK 已拿掉，理由跟一開始討論的「訂單要獨立於帳號存在與否、長期保留」不同——
**這次真正的理由是配合「每日重置」機制**：demo 環境需要每天砍掉測試帳號（`daily_demo_reset()`，見 [README](../README.md)），
如果保留 FK（預設 `NO ACTION`，行為等同 `RESTRICT`），只要帳號名下還有訂單，`DELETE FROM auth.users` 就會直接被擋下來。
拿掉 FK 後，重置排程改成兩步：先刪帳號，再手動 `DELETE FROM orders WHERE user_id NOT IN (SELECT id FROM auth.users)` 清孤兒訂單，一致性靠應用層／排程保證。

### `id` 與 `order_number` 是否重複
兩者都保留：`id` 是內部技術主鍵（未來若有其他表 FK 回 `orders` 會用這個），`order_number` 是對外業務代號（前端顯示、未來若改編碼規則不影響 PK）。

## 狀態機
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `status` | text | NOT NULL, CHECK ∈ `pending / processing / shipped / delivered / cancelled / refunded` | `'pending'` | 資料庫層強制狀態合法性；目前唯一會被系統改動的轉移只有 `pending → cancelled`（見下方「取消訂單」） |

### 取消訂單（✅ 已實作，RPC：`cancel_order`）
不開放任何一般 `UPDATE`/`DELETE` RLS policy，所有狀態變更**只能透過 `cancel_order(p_order_id uuid)` 這支 `SECURITY DEFINER` RPC**：
- 條件：`user_id = auth.uid()` 且 `status = 'pending'`，一行 SQL 同時完成「是不是自己的訂單」與「狀態是否可取消」兩個檢查
- 同一交易內依 `items` 把 `products.stock` 加回去
- 不做真正的資料列刪除——取消永遠是 `UPDATE status`，訂單紀錄本身保留，使用者自己仍能在訂單列表看到「已取消」的歷史紀錄
- 異動由 [orders_audit_log](../orders_audit_log/schema.md) 自動記錄

「管理員改出貨/已完成狀態」這類管理後台功能**不在目前範圍內**，之後若要做，建議另開一條給 `admin_item` 的 UPDATE policy 或另一支 RPC，而不是放寬整欄位權限。

## 金額
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `total_amount` | numeric | NOT NULL | – | 商品總額，由 `create_order` RPC 依 `items` 內的 `subtotal` 加總算出（不信任前端傳來的總額） |
| `shipping_fee` | numeric | NOT NULL | `0` | 運費，套用免運券時前端會傳 0 |
| `discount` | numeric | NOT NULL | `0` | 優惠券折扣金額（不含運費，運費另外算），由前端依套用的優惠券算好後傳入 |
| `final_amount` | numeric | NOT NULL | – | 實付金額 = `total_amount + shipping_fee - discount`，由 RPC 算出，與 `total_amount` 分開存屬於「下單當下金額快照」設計，避免商品日後改價影響歷史訂單 |

## 明細與物流
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `items` | jsonb | NOT NULL | `'[]'` | 訂單商品明細整包存 jsonb（品名/數量/單價快照），刻意不拆成獨立表、不依賴 `products` FK，避免商品被刪除或改動影響歷史訂單（討論過是否要拆表，結論是維持現況，見下方「是否拆表」） |
| `shipping_address` | text | NOT NULL | – | 收件地址（下單當下快照，不引用 `user_profiles.address`） |
| `payment_method` | text | NOT NULL | – | 付款方式 |
| `tracking_number` | text | – | – | 物流追蹤碼，出貨後才有值（目前沒有出貨流程，欄位保留但未被寫入） |
| `estimated_delivery` | timestamptz | – | – | 預計送達時間（同上，未被寫入） |
| `note` | text | – | – | 備註 |

### 是否要把 `items` 拆成獨立表
結論：不拆，維持 jsonb。理由：
- 現有設計是刻意的「快照」模式，拆表並用 FK 關聯 `products` 反而會破壞這個特性
- 專案規模小，沒有「大量查詢『哪些訂單包含商品 X』」這種需要正規化才能解決的查詢需求，屬於 YAGNI

## 時間戳
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `created_at` | timestamptz | NOT NULL | `now()` | 訂單建立時間，前端排序（`order=created_at.desc`）與顯示都用這個欄位 |

`order_date` ✅ **已移除**（migration: `orders_drop_order_date`）。原因：查證後 `order_date` 與 `created_at` 兩者在 INSERT 當下都是 `now()`，
沒有「補登歷史訂單」之類會讓兩者出現時間差的功能，屬於單純語意重複。**跟先前版本的決定相反**：先前版本傾向留 `order_date`、刪 `created_at`，
這次改成留 `created_at`、刪 `order_date`——理由是用戶希望命名跟語意統一用「建立時間」這個更通用的說法，而非電商情境特化的 `order_date`。
連動改了 `src/services/api.ts`（排序條件、`RawOrder` mapper）與 `src/services/type.ts`（`RawOrder` 型別）。

## RLS Policy
- `SELECT`：`auth.uid() = user_id`，只能看自己的訂單
- `INSERT`：`with_check: auth.uid() = user_id`，只能以自己身份建立訂單（但實務上前端已改走 `create_order` RPC，這條 policy 是保底）
- **刻意不開放任何 `UPDATE`/`DELETE` policy**：所有狀態變更（目前只有取消）都必須透過 `cancel_order` RPC，不留任何能繞過 RPC 內條件檢查的後門

## 索引
`orders_pkey`（id）、`orders_order_number_key`（order_number unique）。

## 相關 RPC
- [`create_order`](../README.md#rpc)：建立訂單，同一交易內檢查+扣 `products.stock`
- [`cancel_order`](../README.md#rpc)：取消訂單，同一交易內回補 `products.stock`，觸發稽核日誌

## 審查日誌
更新紀錄由獨立表 [orders_audit_log](../orders_audit_log/schema.md) 管理。
