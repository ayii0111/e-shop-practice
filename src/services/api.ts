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

// ─── 商品詳情 API ─────────────────────────────────────────────────────────────
import type { Product } from './type'

/**
 * 取得單一商品詳情，並附帶當前用戶的 like 狀態
 * 對應 RPC: get_product_with_like_status(product_id_input, user_id_input?)
 *
 * @param productId  商品 UUID（從路由 params 取得）
 * @param userId     當前登入用戶 UUID，未登入時傳 null
 */
export async function productDetailApi(
  productId: string,
  userId: string | null,
): Promise<Product | null> {
  const [error, resp] = await to(
    supabaseApi.post('/rpc/get_product_with_like_status', {
      product_id_input: productId,
      user_id_input: userId ?? undefined,
    }),
  ) as [Error, any]

  if (error) {
    useWarpToast('取得商品資料失敗', error.message)
    debugLog('productDetailApi 失敗', () => error)
    return null
  }

  // RPC 回傳陣列，取第一筆
  return resp?.data?.[0] ?? null
}

/**
 * 將商品加入購物車（或若已存在則累加數量）
 * 做法：讀取當前 cart_list → 前端合併 → 整個覆寫回去
 */
export async function addToCartApi(userId: string, productId: string, quantity: number = 1): Promise<void> {
  // Step 1：讀取當前 cart_list
  const [readError, readResp] = await to(
    supabaseApi.get(`/user_profiles?user_id=eq.${userId}&select=cart_list`),
  ) as [Error, any]

  if (readError) {
    useWarpToast('加入購物車失敗', readError.message)
    return
  }

  const currentList: RawCartEntry[] = readResp?.data?.[0]?.cart_list ?? []

  // Step 2：若商品已存在則累加數量，否則新增
  const existing = currentList.find(entry => entry.product_id === productId)
  const newList: RawCartEntry[] = existing
    ? currentList.map(entry =>
      entry.product_id === productId
        ? { ...entry, quantity: entry.quantity + quantity }
        : entry,
    )
    : [...currentList, { product_id: productId, quantity }]

  // Step 3：覆寫回去
  const [writeError] = await to(
    supabaseApi.patch(
      `/user_profiles?user_id=eq.${userId}`,
      { cart_list: newList },
    ),
  ) as [Error, any]

  if (writeError) {
    useWarpToast('加入購物車失敗', writeError.message)
    debugLog('addToCartApi 失敗', () => writeError)
  }
}

// ─── 訂單 API ─────────────────────────────────────────────────────────────────
import type { Order, OrderItem, RawOrder } from './type'

// ── 防腐層 mapper ──────────────────────────────────────────────────────────────
function toOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    orderDate: raw.created_at,
    status: raw.status,
    items: raw.items,
    totalAmount: raw.total_amount,
    shippingFee: raw.shipping_fee,
    discount: raw.discount,
    finalAmount: raw.final_amount,
    shippingAddress: raw.shipping_address,
    paymentMethod: raw.payment_method,
    trackingNumber: raw.tracking_number ?? undefined,
    estimatedDelivery: raw.estimated_delivery ?? undefined,
    note: raw.note ?? undefined,
  }
}

/**
 * 建立訂單（結帳頁送出訂單時呼叫）
 * 走 RPC create_order：user_id 由後端用 auth.uid() 決定（不信任前端傳值），
 * 同一交易內完成「檢查+扣庫存」與「寫入訂單」，庫存不足會整筆失敗
 */
export async function createOrderApi(order: {
  items: OrderItem[]
  shippingFee: number
  discount: number
  shippingAddress: string
  paymentMethod: string
  appliedCouponCodes?: string[]
  note?: string
}): Promise<Order | null> {
  const [error, resp] = await to(
    supabaseApi.post('/rpc/create_order', {
      p_items: order.items,
      p_shipping_fee: order.shippingFee,
      p_discount: order.discount,
      p_shipping_address: order.shippingAddress,
      p_payment_method: order.paymentMethod,
      p_applied_coupon_codes: order.appliedCouponCodes ?? [],
      p_note: order.note ?? null,
    }),
  ) as [Error, any]

  if (error) {
    useWarpToast('建立訂單失敗', error.message)
    debugLog('createOrderApi 失敗', () => error)
    return null
  }

  const raw: RawOrder | undefined = Array.isArray(resp?.data) ? resp.data[0] : resp?.data
  return raw ? toOrder(raw) : null
}

/**
 * 取消訂單（走 RPC cancel_order）
 * 後端限制：只有 status='pending' 且是本人的訂單才能取消，取消時會自動回補庫存並寫入稽核日誌
 */
export async function cancelOrderApi(orderId: string): Promise<Order | null> {
  const [error, resp] = await to(
    supabaseApi.post('/rpc/cancel_order', { p_order_id: orderId }),
  ) as [Error, any]

  if (error) {
    useWarpToast('取消訂單失敗', error.message)
    debugLog('cancelOrderApi 失敗', () => error)
    return null
  }

  const raw: RawOrder | undefined = Array.isArray(resp?.data) ? resp.data[0] : resp?.data
  return raw ? toOrder(raw) : null
}

// ─── 優惠券 API ─────────────────────────────────────────────────────────────
import type { Coupon, CouponTemplate } from './type'

/**
 * 驗證一組優惠碼是否現在可用（結帳頁輸入優惠碼時呼叫）
 * usability_enable 由 coupon_templates 的排程自動維護，直接查這個欄位即可，不用自己比對時間
 */
export async function fetchCouponApi(code: string): Promise<Coupon | null> {
  const [error, resp] = await to(
    supabaseApi.get('/coupon_templates', {
      params: {
        coupon_code: `eq.${code}`,
        usability_enable: 'eq.true',
        select: 'coupon_code,coupon_name,discount_type,discount_value,threshold_amount',
      },
    }),
  ) as [Error, any]

  if (error) {
    debugLog('fetchCouponApi 失敗', () => error)
    return null
  }

  return resp?.data?.[0] ?? null
}

/**
 * 取得「我的優惠券」頁面用的優惠券範本列表
 * 只取已開放領取（claim_enable）的範本；沒有 per-user 領取/使用紀錄表，
 * 故無法區分「已使用」「剩餘張數」，狀態只依 usability_enable + valid 期間判斷
 */
export async function getCouponTemplatesApi(): Promise<CouponTemplate[]> {
  const [error, resp] = await to(
    supabaseApi.get('/coupon_templates', {
      params: {
        claim_enable: 'eq.true',
        select: 'coupon_code,coupon_name,coupon_description,discount_type,discount_value,threshold_amount,claim_enable,usability_enable,valid_start_at,valid_end_at',
      },
    }),
  ) as [Error, any]

  if (error) {
    useWarpToast('取得優惠券失敗', error.message)
    debugLog('getCouponTemplatesApi 失敗', () => error)
    return []
  }

  return resp?.data ?? []
}

/** 取得用戶的訂單列表，依訂單時間新到舊排序 */
export async function getOrdersApi(userId: string): Promise<Order[]> {
  const [error, resp] = await to(
    supabaseApi.get(`/orders?user_id=eq.${userId}&order=created_at.desc`),
  ) as [Error, any]

  if (error) {
    useWarpToast('取得訂單失敗', error.message)
    debugLog('getOrdersApi 失敗', () => error)
    return []
  }

  const rawOrders: RawOrder[] = resp?.data ?? []
  return rawOrders.map(toOrder)
}
