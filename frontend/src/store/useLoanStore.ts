import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoanApplication } from '@/types'

interface State {
  applications: LoanApplication[]
  applyForLoan: (a: LoanApplication) => void
  repay: (id: string, amount: number) => void
  activeLoan: () => LoanApplication | undefined
}

export const useLoanStore = create<State>()(
  persist(
    (set, get) => ({
      applications: [],
      applyForLoan: (a) => set(s => ({ applications: [a, ...(s.applications ?? [])] })),
      repay: (id, amount) => set(s => ({
        applications: (s.applications ?? []).map(l =>
          l.id === id
            ? {
                ...l,
                totalRepayment: Math.max(0, l.totalRepayment - amount),
                status: l.totalRepayment - amount <= 0 ? 'repaid' as const : l.status,
              }
            : l
        ),
      })),
      activeLoan: () =>
        (get().applications ?? []).find(l => l.status === 'active' || l.status === 'approved'),
    }),
    {
      name: 'opay-loans-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.applications)) state.applications = []
      },
    }
  )
)
