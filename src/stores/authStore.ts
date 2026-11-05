import { create } from 'zustand'
import { clearToken, getToken, setToken } from '../lib/auth'
import { queryClient } from '../lib/queryClient'

interface AuthState {
  isAuthenticated: boolean
  signIn: (token: string) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  isAuthenticated: Boolean(getToken()),

  signIn: (token) => {
    setToken(token)
    set({ isAuthenticated: true })
  },

  signOut: () => {
    clearToken()
    set({ isAuthenticated: false })
    // Drop everything fetched with the old token so the next admin starts clean.
    queryClient.clear()
  },
}))
