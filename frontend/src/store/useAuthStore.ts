import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  onboardingComplete: boolean
  setUser: (u: User, t: string) => void
  updateUser: (u: Partial<User>) => void
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
  setOnboardingComplete: (v: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      onboardingComplete: false,
      setUser: (user, token) => {
        localStorage.setItem('access_token', token)
        set({ user, accessToken: token, isAuthenticated: true })
      },
      updateUser: (u) => {
        const cur = get().user
        if (cur) set({ user: { ...cur, ...u } })
      },
      setOnboardingComplete: (v) => set({ onboardingComplete: v }),
      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('access_token')
        set({ user: null, accessToken: null, isAuthenticated: false })
      },
      refreshMe: async () => {
        if (!get().accessToken) return
        set({ isLoading: true })
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data.user, isAuthenticated: true })
        } catch {
          await get().logout()
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'opay-auth-v10',
      partialize: s => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
        onboardingComplete: s.onboardingComplete,
      }),
    }
  )
)
