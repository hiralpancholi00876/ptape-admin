import axios, { isAxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { getToken } from './auth'
import { useAuthStore } from '../stores/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5551/api/v1/admin/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401: no token was sent. 403: the token was rejected (expired or invalid).
    const status = error.response?.status
    const { isAuthenticated, signOut } = useAuthStore.getState()
    // Several requests can fail at once; only the first one signs out.
    if ((status === 401 || status === 403) && isAuthenticated) {
      // ProtectedRoute then redirects to /login, remembering the current page.
      signOut()
      toast('Your session has expired. Please sign in again.', { id: 'session-expired' })
    }
    return Promise.reject(error)
  },
)

// The API answers most failures with HTTP 200 and { success: false, message }.
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export function errorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error) && error.response?.data?.message) {
    return String(error.response.data.message)
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}
