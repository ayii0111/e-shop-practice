import axios from 'axios'

// 建立 Axios 實例用於 Supabase REST API
export const supabaseApi = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  },
})

// 建立 Axios 實例用於 Supabase Auth API
export const supabaseAuth = axios.create({
  baseURL: `${import.meta.env.VITE_SUPABASE_URL}/auth/v1`,
  headers: {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json',
  },
})

// 請求攔截器：自動添加 Authorization header
supabaseApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
  }
  return config
})

supabaseAuth.interceptors.request.use((config) => {
  const token = localStorage.getItem('supabase_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    config.headers.Authorization = `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
  }
  return config
})
