# orders（訂單）
修改部分：
- 刪除本表所有 FK
- 不懂 id 與 order_number 共同存在的必要，應重新評估
- 說明 status 屬於當前狀態欄位，實際上當狀態改變時，都應該要儲存訂單日誌，以便之後設計法律問題可以釐清(此處設計目的你覺得我這樣講有道理嗎？)
- order_date 與 created_at 欄位，是否沒有必要重複

- PK: `id`，FK：`user_id` → `auth.users.id`

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 說明」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 識別 / 歸屬

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `id` | uuid | PK, NOT NULL | `gen_random_uuid()` | 主鍵 |
| `user_id` | uuid | NOT NULL, FK → `auth.users.id` | – | 下單用戶 |
| `order_number` | text | NOT NULL, UNIQUE | – | 對外顯示的訂單編號，與 `id`（內部主鍵）分離，方便未來換編號規則不動 PK |

## 狀態機

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `status` | text | NOT NULL, CHECK ∈ `pending / processing / shipped / delivered / cancelled / refunded` | `'pending'` | 資料庫層強制狀態合法性 |

## 金額

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `total_amount` | numeric | NOT NULL | – | 商品總額 |
| `shipping_fee` | numeric | NOT NULL | `0` | 運費 |
| `discount` | numeric | NOT NULL | `0` | 折扣金額 |
| `final_amount` | numeric | NOT NULL | – | 實付金額，與 `total_amount` 分開存而非即時計算，屬於「下單當下金額快照」設計，避免商品日後改價影響歷史訂單 |

## 明細與物流

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `items` | jsonb | NOT NULL | `'[]'` | 訂單商品明細整包存 jsonb（品名/數量/單價快照），同樣是快照設計，不依賴 `products` FK，避免商品被刪除或改動影響歷史訂單 |
| `shipping_address` | text | NOT NULL | – | 收件地址（下單當下快照，不引用 `user_profiles.address`） |
| `payment_method` | text | NOT NULL | – | 付款方式 |
| `tracking_number` | text | – | – | 物流追蹤碼，出貨後才有值 |
| `estimated_delivery` | timestamptz | – | – | 預計送達時間 |
| `note` | text | – | – | 備註 |

## 時間戳

| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `order_date` | timestamptz | NOT NULL | `now()` | 訂單日期 |
| `created_at` | timestamptz | NOT NULL | `now()` | 建立時間（與 order_date 重複但語意不同：order_date 可能代表下單時間，created_at 代表資料列建立時間） |

## RLS Policy
- `SELECT`：`auth.uid() = user_id`，只能看自己的訂單。
- `INSERT`：`with_check: auth.uid() = user_id`，只能以自己身份建立訂單。
- 無 `UPDATE`／`DELETE` policy → 一般使用者無法修改或刪除訂單（狀態變更、出貨等應由後端 service_role 處理）。

## 索引
`orders_pkey`（id）、`orders_order_number_key`（order_number unique）。
