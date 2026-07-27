# site_config（站台設定，key-value 表）

PK: `config_key`

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 說明」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 欄位
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `config_key` | text | PK, NOT NULL | – | 設定項目的鍵名，文字 key 而非 enum，方便日後新增設定不用改 schema |
| `config_value` | jsonb | NOT NULL | – | 設定內容，用 jsonb 是因為不同 key 對應的資料結構完全不同（陣列 vs 物件），單表存所有設定省去多張設定表 |
| `updated_at` | timestamptz | NOT NULL | `now()` | 最後修改時間 |

## 目前資料（3 筆）
| config_key | 用途推測 |
|---|---|
| `carousel_list` | 首頁輪播圖清單 |
| `showcase_products` | 首頁精選/展示商品清單 |
| `contact_info` | 聯絡資訊（客服信箱、電話等） |

## 設計意圖
典型 EAV（Entity-Attribute-Value）簡化版，用單表取代「每種設定各開一張表」，
適合這種筆數少、結構鬆散、不需要跨欄位查詢的站台級設定。

## RLS Policy
⚠️ `rls_enabled = true` 但**查無任何 policy**，代表首頁若靠 anon key 直接讀 `site_config`（輪播圖、聯絡資訊等本應公開的內容）目前會被 RLS 擋下、拿不到資料。
需視實際串接方式確認：是否改由後端（service_role）代讀，或需補上一條 `SELECT` policy 開放給 `anon`/`public`。
