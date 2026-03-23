import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { BNPLPlan } from '@/types'

interface CreatePayload {
  merchant: string; merchantLogo: string; description: string
  totalAmount: number; installments: number; frequency: 'weekly'|'biweekly'|'monthly'
}
interface State {
  plans: BNPLPlan[]
  totalOutstanding: number
  isLoading: boolean
  fetchPlans: () => Promise<void>
  createPlan: (p: CreatePayload) => Promise<BNPLPlan>
  payInstallment: (planId: string, installmentNumber: number) => Promise<BNPLPlan>
}

export const useBNPLStore = create<State>()(
  persist(
    (set) => ({
      plans: [], totalOutstanding: 0, isLoading: false,
      fetchPlans: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/pay-later')
          set({ plans: data.data.plans ?? [], totalOutstanding: data.data.totalOutstanding ?? 0 })
        } catch {} finally { set({ isLoading: false }) }
      },
      createPlan: async (payload) => {
        const { data } = await api.post('/pay-later', payload)
        const plan: BNPLPlan = data.data
        set(s => ({ plans: [plan, ...(s.plans ?? [])] }))
        return plan
      },
      payInstallment: async (planId, installmentNumber) => {
        const { data } = await api.post(`/pay-later/${planId}/pay`, { installmentNumber })
        const updated: BNPLPlan = data.data.plan
        set(s => ({ plans: (s.plans ?? []).map(p => p.id === planId ? updated : p) }))
        return updated
      },
    }),
    {
      name: 'opay-bnpl-v10',
      onRehydrateStorage: () => (s) => { if (s && !Array.isArray(s.plans)) s.plans = [] },
    }
  )
)
