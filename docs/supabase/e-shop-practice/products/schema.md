# products（商品主檔）

PK: `product_id`

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 說明」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。
> 全專案皆未使用生成欄位（GENERATED）／身分欄位（IDENTITY）／COLLATE／STORAGE 這組屬性，故不另立欄位。

## 基本識別
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `product_id` | uuid | PK, NOT NULL | `gen_random_uuid()` | 主鍵 |
| `sku` | text | – | – | 商品貨號，可為空，且未加 unique（同 sku 理論上可重複） |
| `name` | text | NOT NULL | – | 商品名稱 |
| `category` | text | NOT NULL | – | 分類，供列表頁篩選 |

## 價格與庫存
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `original_price` | numeric | NOT NULL | – | 原價 |
| `sale_price` | numeric | NOT NULL | – | 特價（與原價分開存，前端自行判斷是否顯示折扣） |
| `stock` | integer | NOT NULL | `0` | 庫存數量 |

## 展示內容
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `img_urls` | text[] | NOT NULL | `'{}'` | 商品圖片網址陣列（Firebase 儲存），支援多圖 |
| `description` | text | – | – | 商品描述（可為空） |
| `average_rating` | numeric | NOT NULL | `0` | 平均評分，目前無對應評論表，推測是預留欄位或前端寫死 |

## 狀態
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `product_status` | text[] | NOT NULL | `'{}'` | 商品狀態標籤陣列（如上架/熱銷等），用陣列而非單一狀態代表可同時具備多個標籤 |

## 時間戳
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `created_at` | timestamptz | NOT NULL | `now()` | – |
| `updated_at` | timestamptz | NOT NULL | `now()` | – |

## RLS Policy
啟用 RLS，但四個動作（SELECT/INSERT/UPDATE/DELETE）皆為 `roles: public`、`qual/with_check: true`，
等同**完全開放讀寫**，未限制須登入或本人。設計意圖推測：商品資料為公開展示用途，
但 INSERT/UPDATE/DELETE 也對 public 開放明顯是練習專案的簡化做法，正式環境應收斂為僅 `service_role` 或 `authenticated` 且具管理員角色才能寫入。

## 索引
僅有主鍵索引 `products_pkey`，無額外索引（`category` 若常用於篩選查詢，可考慮加 index）。
