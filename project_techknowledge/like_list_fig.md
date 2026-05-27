# 商品要顯示用戶 like 狀態


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
