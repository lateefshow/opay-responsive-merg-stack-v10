import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (err) => Promise.reject(err)
)

// Auto-refresh on 401
let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }
      isRefreshing = true
      try {
        const { data } = await api.post('/auth/refresh')
        const newToken = data.data?.accessToken
        if (newToken) {
          localStorage.setItem('access_token', newToken)
          refreshQueue.forEach((cb) => cb(newToken))
          refreshQueue = []
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        }
      } catch {
        localStorage.removeItem('access_token')
        window.location.href = '/login'
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(err)
  }
)

export default api
