# 商品要顯示用戶 like 狀態
**supabase 負責額外添加 is_liked 欄位**:
```
-- 建立一個函式，名稱叫 get_products_with_like_status
-- 括號裡是「輸入參數」：一個名叫 user_id_input，型別為 uuid 的值
CREATE OR REPLACE FUNCTION public.get_products_with_like_status(user_id_input uuid)

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

-- $$ 和 $$ 之間是函式的主體，就是實際要執行的 SQL 查詢
-- SQL 是宣告式語言，不是程序式語言
-- 他通常會把宣告放前面，但執行次序看起來會有點顛倒，先寫輸出 (SELECT) -> 再寫輸入 (FROM/JOIN)
SET search_path = pg_catalog, public
AS $$
  SELECT
    p.id,
    p.name,
    p.price,
    p.image_url,
    COALESCE(
      p.id = ANY(up.like_list),
      false
    ) AS is_liked,
    -- 對應 is_liked 的欄位，他會檢查 p.id 是否存在於該用戶的 like_list 陣列中
    -- 若有 is_liked = true，沒有就是 false
    -- 其他欄位則對應既有欄位
    p.created_at
  FROM public.products p
  LEFT JOIN LATERAL (
    SELECT like_list
    FROM public.user_profiles
    WHERE id = user_id_input
    -- 查詢 user_profiles 表格，匹配函式輸入參數 user_id_input 的那一筆個資
    -- 而實際帶入參數的即為 url 中輸入的 user_id

    LIMIT 1
  ) up ON true
  ORDER BY p.created_at DESC;

$$;
```

**備用**:
```
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
