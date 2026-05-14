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

// ─── 登入用：透過 RPC 取得商品列表，含 is_liked 狀態 ──────────────────────────
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
