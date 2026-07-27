export type Product = {
  name: string // 中/英文商品名稱
  original_price: number // 原價（計算折扣用）
  sale_price: number // 單品特價
  img_urls: string[] // 圖片網址陣列
  product_status: string[] // 現貨 / 新品 / 預購 / 限購
  product_id: string // 商品 ID
  sku: string // 貨號（例如 TOP-2024-0001）
  stock: number // 庫存數量
  created_at: Date // 建立時間
  updated_at: Date // 上次更新時間
  description: string // 商品描述
  category: string // 種類 (top / bottom / shoes / accessory / life)
  average_rating: number // 星等評價 (0–5)
  is_liked?: boolean // 當前用戶是否已收藏（登入時由 RPC 回傳，未登入時不存在）
}

// ─── 購物車相關後端原始型別（防腐層：只在 api.ts 的 mapper 內使用）──────────

/** user_profiles.cart_list 陣列中每一筆的原始結構 */
export type RawCartEntry = {
  product_id: string
  quantity: number
}

/** Supabase products 資料表的原始欄位（與前端 CartItem 的屬性名稱不同） */
export type RawProduct = {
  product_id: string
  name: string
  original_price: number
  sale_price: number
  img_urls: string[]
  product_status: string[]
  stock: number
  category: string
}

// ─── 訂單相關型別 ─────────────────────────────────────────────────────────────

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'

export type OrderItem = {
  id: string
  productName: string
  productImage?: string
  quantity: number
  price: number // 實賣價（下單當下的成交單價）
  originalPrice: number // 原價（下單當下的商品原價快照，供折扣顯示用）
  subtotal: number
}

export type Order = {
  id: string
  orderNumber: string
  orderDate: string
  status: OrderStatus
  items: OrderItem[]
  totalAmount: number
  shippingFee: number
  discount: number
  finalAmount: number
  shippingAddress: string
  paymentMethod: string
  trackingNumber?: string
  estimatedDelivery?: string
  note?: string
}

/** Supabase orders 資料表的原始欄位（snake_case，與前端 Order 屬性名稱不同） */
export type RawOrder = {
  id: string
  order_number: string
  order_date: string
  status: OrderStatus
  items: OrderItem[]
  total_amount: number
  shipping_fee: number
  discount: number
  final_amount: number
  shipping_address: string
  payment_method: string
  tracking_number: string | null
  estimated_delivery: string | null
  note: string | null
}
