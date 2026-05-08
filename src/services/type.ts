export type Product = {
  name: string // 中/英文商品名稱
  original_price: number // 原價（計算折扣用）
  sale_price: number // 單品特價
  img_urls: string[] // 圖片網址陣列
  product_status: string[] // 現貨 / 新品 / 預購 / 限購
  product_id: string // 商品 ID
  stock: number // 庫存數量
  created_at: Date // 建立時間
  updated_at: Date // 上次更新時間
  description: string // 商品描述
  category: string // 種類 (top / bottom / shoes / accessory / life)
  average_rating: number // 星等評價 (0–5)
}
