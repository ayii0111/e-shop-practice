import { debugLog, useWarpToast } from '@util'

import { supabaseApi } from './api-base'

// limit 默認為 12
// 輸入類別（未登入用，不含 is_liked）
export async function categoryApi(category: string, limit: number, offset: number) {
  let categoryPath = `category=eq.${encodeURIComponent(category)}&`
  if (category === 'all') { categoryPath = '' }
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(`/products?${categoryPath}limit=${limit}&offset=${offset}`, { headers })
}

// 輸入用戶 UUID，取得該用戶的 like 商品清單（未登入用，不含 is_liked）
// 流程：先從用戶表取得 liked_products（商品 id 陣列），再批次取得商品資料
export async function likeApi(userid: string, limit: number, offset: number) {
  // Step 1：取得用戶的 liked_products
  const [userRespError, userResp] = await to(supabaseApi.get(`/user_profiles?user_id=eq.${userid}&select=liked_products`)) as [Error, any]
  if (userRespError) {
    useWarpToast('取得用戶 like_list 失敗', userRespError.message)
    debugLog('取得用戶 like_list 失敗', () => userRespError)
  }
  const likeList: string[] = userResp?.data?.[0]?.liked_products ?? []

  if (likeList.length === 0) {
    // 沒有 like 的商品，直接回傳空結果
    return { data: [], headers: { 'content-range': '0-0/0' } }
  }

  // Step 2：用 liked_products 的商品 id 批次查詢商品
  const ids = likeList.join(',')
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(`/products?product_id=in.(${ids})&limit=${limit}&offset=${offset}`, { headers })
}

// 輸入搜尋關鍵字，模糊比對商品名稱（未登入用，不含 is_liked）
export async function searchApi(keyword: string, limit: number, offset: number) {
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(
    `/products?name=ilike.*${encodeURIComponent(keyword)}*&limit=${limit}&offset=${offset}`,
    { headers },
  )
}

// ─── 收藏切換：做法 A（前端讀取後覆寫整個陣列） ──────────────────────────────
// 流程：先讀取用戶當前的 liked_products → 在前端加入或移除商品 ID → PATCH 整個陣列回去
//
// ⚠️ 已知限制（做法 A 的取捨）：
//   - 需要兩次請求（GET + PATCH），比做法 B 多一次網路往返
//   - 有競態條件風險：若用戶在兩個分頁同時操作，後寫的會覆蓋先寫的
//   - 選擇此做法的原因：避免過度依賴後端 RPC，前端邏輯自給自足
//
// 📌 日後若要改成做法 B（RPC 原子操作）：
//   - 在 Supabase 建立 RPC 函式，使用 array_append / array_remove 操作
//   - 前端只需傳 user_id、product_id、action（'add' | 'remove'）
//   - 一次請求完成，無競態問題
export async function toggleLikeApi(userId: string, productId: string, isCurrentlyLiked: boolean) {
  // Step 1：讀取當前的 liked_products
  const [readError, readResp] = await to(
    supabaseApi.get(`/user_profiles?user_id=eq.${userId}&select=liked_products`),
  ) as [Error, any]

  if (readError) { throw readError }

  const currentList: string[] = readResp.data?.[0]?.liked_products ?? []

  // Step 2：在前端加入或移除商品 ID
  const newList = isCurrentlyLiked
    ? currentList.filter((id: string) => id !== productId)  // 移除
    : [...new Set([...currentList, productId])]              // 加入（Set 防止重複）

  // Step 3：PATCH 整個陣列回去
  const [writeError] = await to(
    supabaseApi.patch(
      `/user_profiles?user_id=eq.${userId}`,
      { liked_products: newList },
    ),
  ) as [Error, any]

  if (writeError) { throw writeError }

  return newList
}
// 對應 Supabase 函式 get_products_with_like_status
// user_id_input 傳入當前登入用戶的 UUID
export async function productsWithLikeApi(
  userId: string,
  category: string | null,
  keyword: string | null,
  limit: number,
  offset: number,
) {
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.post(
    '/rpc/get_products_with_like_status',
    {
      user_id_input: userId,
      category_input: category,
      search_input: keyword,
      limit_input: limit,
      offset_input: offset,
    },
    { headers },
  )
}

// ─── 購物車 API ───────────────────────────────────────────────────────────────
import type { CartItem } from '@stores/useCartStore'
import type { RawCartEntry, RawProduct } from './type'

// ── 防腐層 mapper ──────────────────────────────────────────────────────────────
// 後端欄位名稱只在此處出現，轉換後其餘程式碼只認識前端的 CartItem 介面
// 日後後端改欄位名稱，只需修改這一個函式
function toCartItem(raw: RawProduct, quantity: number): CartItem {
  return {
    id: raw.product_id,
    name: raw.name,
    image: raw.img_urls?.[0] ?? '',
    category: raw.category,
    salePrice: raw.sale_price,
    originalPrice: raw.original_price,
    quantity,
    inventoryStatus: raw.product_status?.[0] ?? '',
  }
}

/**
 * 取得用戶購物車商品列表
 * 流程：
 *   Step 1：從 user_profiles 取得 cart_list（[{ product_id, quantity }]）
 *   Step 2：用 product_id 批次查詢商品資料
 *   Step 3：透過 mapper 轉換為前端 CartItem[]
 */
export async function cartApi(userId: string): Promise<CartItem[]> {
  // Step 1：取得 cart_list
  const [cartListError, cartListResp] = await to(
    supabaseApi.get(`/user_profiles?user_id=eq.${userId}&select=cart_list`),
  ) as [Error, any]

  if (cartListError) {
    useWarpToast('取得購物車失敗', cartListError.message)
    debugLog('取得購物車失敗', () => cartListError)
    return []
  }

  const cartList: RawCartEntry[] = cartListResp?.data?.[0]?.cart_list ?? []
  if (cartList.length === 0) { return [] }

  // Step 2：批次查詢商品資料
  const ids = cartList.map(entry => entry.product_id).join(',')
  const [productsError, productsResp] = await to(
    supabaseApi.get(`/products?product_id=in.(${ids})`),
  ) as [Error, any]

  if (productsError) {
    useWarpToast('取得購物車商品資料失敗', productsError.message)
    debugLog('取得購物車商品資料失敗', () => productsError)
    return []
  }

  const rawProducts: RawProduct[] = productsResp?.data ?? []

  // Step 3：mapper 轉換，並依 cart_list 的順序與數量組合
  const productMap = new Map(rawProducts.map(p => [p.product_id, p]))

  return cartList
    .filter(entry => productMap.has(entry.product_id)) // 過濾已下架商品
    .map(entry => toCartItem(productMap.get(entry.product_id)!, entry.quantity))
}

/**
 * 將當前購物車狀態整個覆寫回 user_profiles.cart_list
 * 離開購物車頁面時呼叫，避免每次修改數量都發送請求
 */
export async function updateCartApi(userId: string, cartItems: CartItem[]): Promise<void> {
  const cartList: RawCartEntry[] = cartItems.map(item => ({
    product_id: item.id,
    quantity: item.quantity,
  }))

  const [error] = await to(
    supabaseApi.patch(
      `/user_profiles?user_id=eq.${userId}`,
      { cart_list: cartList },
    ),
  ) as [Error, any]

  if (error) {
    useWarpToast('購物車儲存失敗', error.message)
    debugLog('updateCartApi 失敗', () => error)
  }
}

/**
 * 從 cart_list 移除單一商品（立即寫入，x 按鈕點擊時呼叫）
 * 做法：前端過濾後整個覆寫，與 toggleLikeApi 同樣的做法 A
 */
export async function removeCartItemApi(userId: string, productId: string): Promise<void> {
  // Step 1：讀取當前 cart_list
  const [readError, readResp] = await to(
    supabaseApi.get(`/user_profiles?user_id=eq.${userId}&select=cart_list`),
  ) as [Error, any]

  if (readError) {
    useWarpToast('移除商品失敗', readError.message)
    return
  }

  const currentList: RawCartEntry[] = readResp?.data?.[0]?.cart_list ?? []

  // Step 2：過濾掉要移除的商品
  const newList = currentList.filter(entry => entry.product_id !== productId)

  // Step 3：覆寫回去
  const [writeError] = await to(
    supabaseApi.patch(
      `/user_profiles?user_id=eq.${userId}`,
      { cart_list: newList },
    ),
  ) as [Error, any]

  if (writeError) {
    useWarpToast('移除商品失敗', writeError.message)
    debugLog('removeCartItemApi 失敗', () => writeError)
  }
}
