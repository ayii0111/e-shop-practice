import { supabaseApi } from '@services'

// limit 默認為 12
// 輸入類別
export async function categoryApi (category: string, limit: number, offset: number) {
  let categoryPath = `category=eq.${encodeURIComponent(category)}&`
  if (category === 'all') { categoryPath = '' }
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(`/products?${categoryPath}limit=${limit}&offset=${offset}`, { headers })
}

// 輸入用戶 UUID，取得該用戶的 like 商品清單
// 流程：先從用戶表取得 like_list（商品 id 陣列），再批次取得商品資料
export async function likeApi (userid: string, limit: number, offset: number) {
  // Step 1：取得用戶的 like_list
  const userResp = await supabaseApi.get(`/users?id=eq.${userid}&select=like_list`)
  const likeList: string[] = userResp.data?.[0]?.like_list ?? []

  if (likeList.length === 0) {
    // 沒有 like 的商品，直接回傳空結果
    return { data: [], headers: { 'content-range': '0-0/0' } }
  }

  // Step 2：用 like_list 的商品 id 批次查詢商品
  const ids = likeList.join(',')
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(`/products?product_id=in.(${ids})&limit=${limit}&offset=${offset}`, { headers })
}

// 輸入搜尋關鍵字，模糊比對商品名稱
export async function searchApi (keyword: string, limit: number, offset: number) {
  const headers = { Prefer: 'count=exact' }
  return supabaseApi.get(
    `/products?name=ilike.*${encodeURIComponent(keyword)}*&limit=${limit}&offset=${offset}`,
    { headers },
  )
}
