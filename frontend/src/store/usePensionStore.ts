import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { PensionPlan } from '@/types'

interface UpdatePayload {
  currentAge: number; retirementAge: number; currentBalance: number
  monthlyContribution: number; employerMatchPct: number; expectedReturn: number
}
interface State {
  plan: PensionPlan | null
  isLoading: boolean
  fetchPlan: () => Promise<void>
  updatePlan: (p: UpdatePayload) => Promise<void>
  contribute: (amount: number) => Promise<void>
}

export const usePensionStore = create<State>()(
  persist(
    (set, get) => ({
      plan: null, isLoading: false,
      fetchPlan: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/pension')
          set({ plan: data.data })
        } catch {} finally { set({ isLoading: false }) }
      },
      updatePlan: async (payload) => {
        const { data } = await api.put('/pension', payload)
        set(s => ({ plan: s.plan ? { ...s.plan, ...data.data } : null }))
      },
      contribute: async (amount) => {
        await api.post('/pension/contribute', { amount })
        set(s => ({
          plan: s.plan ? { ...s.plan, currentBalance: (s.plan.currentBalance ?? 0) + amount } : null
        }))
      },
    }),
    {
      name: 'opay-pension-v10',
      onRehydrateStorage: () => () => {},
    }
  )
)
