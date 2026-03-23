import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { NetWorthSnapshot } from '@/types'

interface State {
  current: NetWorthSnapshot | null
  snapshots: NetWorthSnapshot[]
  isLoading: boolean
  fetchNetWorth: () => Promise<void>
}

export const useNetWorthStore = create<State>()(
  persist(
    (set) => ({
      current: null, snapshots: [], isLoading: false,
      fetchNetWorth: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/net-worth')
          set({ current: data.data.current, snapshots: data.data.snapshots ?? [] })
        } catch {} finally { set({ isLoading: false }) }
      },
    }),
    {
      name: 'opay-networth-v10',
      onRehydrateStorage: () => (s) => { if (s && !Array.isArray(s.snapshots)) s.snapshots = [] },
    }
  )
)
