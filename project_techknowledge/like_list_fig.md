# 商品要顯示用戶 like 狀態
**supabase 負責額外添加 is_liked 欄位**:
```SQL
-- 建立函式：查詢商品列表，並附帶當前用戶的收藏狀態
-- 輸入參數：user_id_input（uuid），可傳入已登入用戶的 user_id
-- 未登入時可傳入 NULL，is_liked 全部回傳 false
CREATE OR REPLACE FUNCTION public.get_products_with_like_status(
  user_id_input uuid
)
-- 回傳表格結構，欄位需與 SELECT 的輸出完全對應
-- 型別需與 products 資料表的實際型別一致
RETURNS TABLE (
  product_id     uuid,
  name           text,
  original_price numeric,
  sale_price     numeric,
  img_urls       text[],
  product_status text[],
  stock          integer,
  description    text,
  category       text,
  average_rating numeric,
  created_at     timestamptz,
  updated_at     timestamptz,
  is_liked       boolean  -- 額外附加的收藏狀態欄位，不存在於 products 資料表
)
LANGUAGE sql
-- SECURITY DEFINER：以函式建立者的權限執行
-- 確保一般用戶即使沒有直接查詢 user_profiles 的權限，也能透過此函式取得資料
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    p.product_id,
    p.name,
    p.original_price,
    p.sale_price,
    p.img_urls,
    p.product_status,
    p.stock,
    p.description,
    p.category,
    p.average_rating,
    p.created_at,
    p.updated_at,
    -- 檢查 p.product_id 是否存在於該用戶的 liked_products 陣列中
    -- COALESCE 處理 up 為 NULL 的情況（用戶未登入或查無資料），回傳 false
    COALESCE(
      p.product_id = ANY(up.liked_products),
      false
    ) AS is_liked
  FROM public.products p
  LEFT JOIN LATERAL (
    -- LATERAL 搭配 LIMIT 1，確保只取一筆用戶資料
    -- user_profiles 的主鍵是 user_id（uuid 型別）
    SELECT liked_products
    FROM public.user_profiles
    WHERE user_id = user_id_input
    LIMIT 1
  ) up ON true
  ORDER BY p.created_at DESC;
$$;
```

**備用**:
```SQL
-- 建立一個函式，名稱叫 get_products_with_like_status
-- 括號裡是「輸入參數」：一個名叫 user_id_input，型別為 uuid 的值
CREATE OR REPLACE FUNCTION get_products_with_like_status(user_id_input uuid)

-- 這是函式執行完後，要回傳給前端的資料格式（表格結構）
RETURNS TABLE (
  id uuid,
  name text,
  price numeric,
  image_url text,
  is_liked boolean,
  -- 這個欄位就是前端要用的「是否已收藏」，其他則是既有欄位，一定要全寫一遍
  created_at timestamptz
)

-- 使用 SQL 語言
LANGUAGE sql

-- 用建立者的權限執行，避免一般使用者沒權限查 user_profiles 表
SECURITY DEFINER

-- 安全設定，限制函式只能查我們指定的表
SET search_path = ''

-- $$ 和 $$ 之間是函式的主體，就是實際要執行的 SQL 查詢
-- SQL 是宣告式語言，不是程序式語言
-- 他通常會把宣告放前面，但執行次序看起來會有點顛倒，先寫輸出 (SELECT) -> 再寫輸入 (FROM/JOIN)
AS $$
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    p.id = ANY(up.like_list) AS is_liked,
    -- 對應 is_liked 的欄位，他會檢查 p.id 是否存在於該用戶的 like_list 陣列中
    -- 若有 is_liked = true，沒有就是 false
    -- 其他欄位則對應既有欄位
    p.created_at
  FROM products p
  LEFT JOIN user_profiles up ON up.id = user_id_input
  -- 查詢 user_profiles 表格，匹配函式輸入參數 user_id_input 的那一筆個資
  -- 而實際帶入參數的即為 url 中輸入的 user_id
$$;
```

### 商品列表顯示 like 狀態時，應使用 RPC API

| | REST API | RPC |
|---|---|---|
| 思考方式 | 對「資源」操作（GET /users/1） | 呼叫一個「動作/函式」 |
| 端點 | 很多個 URL，每個對應一個資源 | 一個端點，函式名稱當參數 |
| 舉例 | `GET /products` | `rpc('get_products_with_like_status')` |
| 參數 | 放在 URL 或 Query String | 放在 Request Body |

似乎是一個掛載的動作
```SQL
GRANT EXECUTE ON FUNCTION public.get_products_with_like_status(uuid) TO anon, authenticated;
```

**完整版**:
```SQL
CREATE OR REPLACE FUNCTION public.get_products_with_like_status(
  user_id_input uuid,
  category_input text DEFAULT NULL,
  search_input   text DEFAULT NULL,
  limit_input    integer DEFAULT 12,
  offset_input   integer DEFAULT 0
)
RETURNS TABLE (
  product_id     uuid,
  name           text,
  original_price numeric,
  sale_price     numeric,
  img_urls       text[],
  product_status text[],
  stock          integer,
  description    text,
  category       text,
  average_rating numeric,
  created_at     timestamptz,
  updated_at     timestamptz,
  is_liked       boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    p.product_id,
    p.name,
    p.original_price,
    p.sale_price,
    p.img_urls,
    p.product_status,
    p.stock,
    p.description,
    p.category,
    p.average_rating,
    p.created_at,
    p.updated_at,
    COALESCE(
      p.product_id = ANY(up.liked_products),
      false
    ) AS is_liked
  FROM public.products p
  LEFT JOIN LATERAL (
    SELECT liked_products
    FROM public.user_profiles
    WHERE user_id = user_id_input
    LIMIT 1
  ) up ON true
  WHERE
    (category_input IS NULL OR p.category = category_input)
    AND (search_input IS NULL OR p.name ILIKE '%' || search_input || '%')
  ORDER BY p.created_at DESC
  LIMIT limit_input
  OFFSET offset_input;
$$;
```
