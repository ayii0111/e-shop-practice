# user_profiles（用戶個資）

PK: `user_id`（同時是 FK → `auth.users.id`，1:1 延伸 Supabase Auth 內建用戶表）

> 欄位屬性分類說明：本文件用「型別 / 約束 / 預設值 / 說明」四欄呈現。
> 「約束」欄彙整 NOT NULL、PK、UNIQUE、CHECK、FK；未特別標註即代表允許為 NULL。

## 身份 / 聯絡
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `user_id` | uuid | PK, NOT NULL, FK → `auth.users.id` | – | 對應 Supabase Auth 帳號 |
| `email` | text | NOT NULL | `''` | 冗餘存一份 email（Auth 也有），方便前端不用另外 join |
| `display_name` | text | NOT NULL | `''` | 顯示名稱 |
| `full_name` | text | – | – | 全名（可為空） |
| `avatar_url` | text | – | – | 頭像圖片網址 |
| `phone` | text | – | – | 電話 |
| `gender` | text | – | – | 性別，無 CHECK 約束（自由文字） |
| `birthday` | date | – | – | 生日 |

## 地址
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `address` | text | – | – | 詳細地址 |
| `city` | text | – | – | 城市 |
| `postal_code` | text | – | – | 郵遞區號 |

## 會員等級
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `member_level` | text | – | `'bronze'` | 會員等級，無 CHECK 約束限制可選值，靠前端維護合法值集合 |

## 購物相關（設計上直接內嵌於個資表，非獨立表）
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `liked_products` | uuid[] | – | – | 收藏商品的 `product_id` 陣列，未設 FK（陣列型別無法直接建 FK），一致性靠應用層維護 |
| `cart_list` | jsonb | – | `'[]'` | 購物車內容，整包 jsonb 存（非正規化），對應「讀取→前端修改→整包 PATCH」寫入模式 |

## 時間戳
| 欄位 | 型別 | 約束 | 預設值 | 說明 |
|---|---|---|---|---|
| `created_at` | timestamptz | – | `now()` | – |
| `updated_at` | timestamptz | – | `now()` | – |

## RLS Policy
- `SELECT`／`UPDATE`：角色限定 `authenticated`，條件 `auth.uid() = user_id`，即只能讀寫自己的資料。
- 無 `INSERT` policy → 代表新增個資列不能透過一般 client 直接寫入，推測由後端/觸發器（例如 Auth Trigger）在註冊時建立。
- 無 `DELETE` policy → 使用者無法自行刪除個資列。

## 設計要點
`liked_products`、`cart_list` 都直接放在個資表而非拆獨立表，屬於「以 JSON/陣列換取查詢簡單」的取捨，
換取一次讀取即可拿到完整用戶狀態，但也代表這兩份資料無法用 SQL 做關聯式查詢/約束（如商品下架時無法用 FK 自動清除收藏）。
