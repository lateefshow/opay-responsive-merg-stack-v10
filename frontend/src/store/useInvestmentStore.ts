import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InvestmentPlan } from '@/types'

interface State {
  investments: InvestmentPlan[]
  addInvestment: (p: InvestmentPlan) => void
  liquidate: (id: string) => void
  totalValue: () => number
  totalReturns: () => number
}

export const useInvestmentStore = create<State>()(
  persist(
    (set, get) => ({
      investments: [],
      addInvestment: (p) => set(s => ({ investments: [p, ...(s.investments ?? [])] })),
      liquidate: (id) => set(s => ({
        investments: (s.investments ?? []).map(i =>
          i.id === id ? { ...i, status: 'liquidated' as const } : i
        ),
      })),
      totalValue: () =>
        (get().investments ?? [])
          .filter(i => i.status === 'active')
          .reduce((sum, i) => sum + i.currentValue, 0),
      totalReturns: () =>
        (get().investments ?? [])
          .filter(i => i.status === 'active')
          .reduce((sum, i) => sum + i.returnAmount, 0),
    }),
    {
      name: 'opay-investments-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.investments)) {
          state.investments = []
        }
      },
    }
  )
)
