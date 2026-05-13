為何不用 supabase 的 auth 數據表來儲存數據？
**auth.users 的限制太多**:
- -不能用 REST API 自由查詢（例如「列出所有 VIP 用戶」）
- 不能加自訂欄位（例如會員等級、積分、推薦人）
- RLS policy 寫不了（它不在 public schema）
- 不能做 JOIN（例如「這個用戶的所有訂單」）
