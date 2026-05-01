export type Product = {
  name: string // 中/英文商品名稱
  originalPrice: number // 原價（計算折扣用）
  salePrice: number // 單品特價
  imgUrls: string[] // 圖片網址陣列
  productStatus: string[] // 現貨 / 新品 / 預購 / 限購
  productId: string // 商品 ID
  stock: number // 庫存數量
  createdAt: Date // 建立時間
  updatedAt: Date // 上次更新時間
  description: string // 商品描述
  category: string // 種類 (top / bottom / shoes / accessory / life)
  averageRating: number // 星等評價 (0–5)
}
