# products（商品主檔）

> ✅ 本文件記錄的設計**已套用到雲端 Supabase**（migration: `products_uuidv7_admin_rls_and_audit_log`、`revoke_log_products_change_public_execute`、`products_add_seed_stock`）。

PK: `product_id`

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 備註」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。
> 全專案皆未使用生成欄位（GENERATED）／身分欄位（IDENTITY）／COLLATE／STORAGE 這組屬性，故不另立欄位。

## 基本識別
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `product_id` | uuid | PK, NOT NULL | `uuidv7()` | 主鍵，改用 UUID v7 取代 `gen_random_uuid()`（v4），理由同 [coupon_templates](../coupon_templates/schema.md#主鍵改用-uuid-v7)：時間戳前綴具排序性，索引寫入效能較 v4 佳 |
| `sku` | text | – | – | 商品貨號，可為空，且未加 unique（同 sku 理論上可重複） |
| `name` | text | NOT NULL | – | 商品名稱 |
| `category` | text | NOT NULL | – | 分類，供列表頁篩選 |

## 價格與庫存
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `original_price` | numeric | NOT NULL | – | 原價 |
| `sale_price` | numeric | NOT NULL | – | 特價（與原價分開存，前端自行判斷是否顯示折扣） |
| `stock` | integer | NOT NULL | `0` | 庫存數量 |
| `seed_stock` | integer | NOT NULL | – | 種子庫存值，供每日重置排程（[daily_demo_reset](../README.md#每日重置demo-用pg_cron)）用來把 `stock` 重置回這個值，避免面試官測試時把商品買光導致其他人無法測試 |

## 展示內容
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `img_urls` | text[] | NOT NULL | `'{}'` | 商品圖片網址陣列（Firebase 儲存），支援多圖 |
| `description` | text | – | – | 商品描述（可為空） |
| `average_rating` | numeric | NOT NULL | `0` | 平均評分，目前無對應評論表，推測是預留欄位或前端寫死 |

## 狀態
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `product_status` | text[] | NOT NULL | `'{}'` | 商品狀態標籤陣列（如上架/熱銷等），用陣列而非單一狀態代表可同時具備多個標籤 |

## 時間戳
| 欄位 | 型別 | 約束 | 預設值 | 備註 |
|---|---|---|---|---|
| `created_at` | timestamptz | NOT NULL | `now()` | – |

`updated_at` 欄位已移除（✅ 已套用）。理由：一個欄位只能記錄「最後一次」更新時間，看不到中間變化過程、也不知道是誰改的；
改由 `products_audit_log` 稽核日誌逐筆記錄每次 UPDATE/DELETE 的操作者與異動前後快照，`operated_at` 取代原本 `updated_at` 的功能，且資訊更完整。

## 操作紀錄審查日誌
更新/刪除紀錄由獨立表 [products_audit_log](../products_audit_log/schema.md) 管理，欄位與寫入機制詳見該文件。

## RLS Policy（✅ 已套用）

| 操作 | 對象 | 條件 |
|---|---|---|
| SELECT | `public` | `true`（所有人可讀，含未登入） |
| INSERT | `public` | `EXISTS (... user_profiles.user_id = auth.uid() AND 'products' = ANY(admin_item))` |
| UPDATE | `public` | 同上 |
| DELETE | `public` | 同上 |

判斷「是否為管理員」的依據是 `user_profiles.admin_item`（逐表授權的 `text[]` 欄位，見 [user_profiles](../user_profiles/schema.md)）。
✅ 已統一：原本另外新增的 `is_admin` 布林欄位已移除，改沿用專案既有的 `admin_item` 機制，與 `coupon_templates` 用同一套判斷邏輯。

## 索引
僅有主鍵索引 `products_pkey`，無額外索引（`category` 若常用於篩選查詢，可考慮加 index）。
