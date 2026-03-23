import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { LoginDevice, LoginHistory, SecurityAlert } from '@/types'

interface State {
  devices: LoginDevice[]
  loginHistory: LoginHistory[]
  alerts: SecurityAlert[]
  unreadAlerts: number
  twoFactorEnabled: boolean
  isLoading: boolean
  fetchOverview: () => Promise<void>
  blockDevice: (id: string) => Promise<void>
  markAlertRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  toggle2FA: () => Promise<void>
}

export const useSecurityStore = create<State>()(
  persist(
    (set, get) => ({
      devices: [], loginHistory: [], alerts: [], unreadAlerts: 0,
      twoFactorEnabled: false, isLoading: false,
      fetchOverview: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/security/overview')
          const d = data.data
          set({ devices: d.devices ?? [], loginHistory: d.loginHistory ?? [], alerts: d.alerts ?? [], unreadAlerts: d.unreadAlerts ?? 0, twoFactorEnabled: d.twoFactorEnabled ?? false })
        } catch {} finally { set({ isLoading: false }) }
      },
      blockDevice: async (id) => {
        await api.post(`/security/devices/${id}/block`)
        set(s => ({ devices: (s.devices ?? []).map(d => d.id === id ? { ...d, trust: 'blocked' as const } : d) }))
      },
      markAlertRead: async (id) => {
        await api.patch(`/security/alerts/${id}/read`)
        set(s => ({
          alerts: (s.alerts ?? []).map(a => a.id === id ? { ...a, isRead: true } : a),
          unreadAlerts: Math.max(0, (s.unreadAlerts ?? 0) - 1),
        }))
      },
      markAllRead: async () => {
        await api.post('/security/alerts/read-all')
        set(s => ({ alerts: (s.alerts ?? []).map(a => ({ ...a, isRead: true })), unreadAlerts: 0 }))
      },
      toggle2FA: async () => {
        const { data } = await api.post('/security/2fa/toggle')
        set({ twoFactorEnabled: data.data.twoFactorEnabled })
      },
    }),
    {
      name: 'opay-security-v10',
      onRehydrateStorage: () => (s) => {
        if (s) {
          if (!Array.isArray(s.devices))      s.devices = []
          if (!Array.isArray(s.loginHistory)) s.loginHistory = []
          if (!Array.isArray(s.alerts))       s.alerts = []
        }
      },
    }
  )
)
