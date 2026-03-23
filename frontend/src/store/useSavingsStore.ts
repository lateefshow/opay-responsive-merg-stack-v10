import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavingsPlan } from '@/types'

const MOCK: SavingsPlan[] = [
  {
    id:'sv1', userId:'', name:'Emergency Fund', emoji:'🛡️', type:'flex',
    targetAmount:500000, currentAmount:75000, interestRate:6, interestEarned:375,
    startDate:new Date(Date.now()-86400000*30).toISOString(), status:'active',
    autoSave:true, frequency:'weekly', color:'#3b82f6',
    createdAt:new Date(Date.now()-86400000*30).toISOString(),
  },
  {
    id:'sv2', userId:'', name:'New MacBook', emoji:'💻', type:'target',
    targetAmount:350000, currentAmount:120000, interestRate:10, interestEarned:1000,
    startDate:new Date(Date.now()-86400000*60).toISOString(),
    endDate:new Date(Date.now()+86400000*90).toISOString(), status:'active',
    autoSave:false, color:'#8b5cf6',
    createdAt:new Date(Date.now()-86400000*60).toISOString(),
  },
]

interface State {
  plans: SavingsPlan[]
  addPlan: (p: SavingsPlan) => void
  updatePlan: (id: string, u: Partial<SavingsPlan>) => void
  deletePlan: (id: string) => void
  topUp: (id: string, amount: number) => void
}

export const useSavingsStore = create<State>()(
  persist(
    (set) => ({
      plans: MOCK,
      addPlan: (p) => set(s => ({ plans: [p, ...(s.plans ?? [])] })),
      updatePlan: (id, u) => set(s => ({
        plans: (s.plans ?? []).map(p => p.id === id ? { ...p, ...u } : p),
      })),
      deletePlan: (id) => set(s => ({
        plans: (s.plans ?? []).filter(p => p.id !== id),
      })),
      topUp: (id, amount) => set(s => ({
        plans: (s.plans ?? []).map(p =>
          p.id === id
            ? { ...p, currentAmount: Math.min(p.currentAmount + amount, p.targetAmount) }
            : p
        ),
      })),
    }),
    {
      name: 'opay-savings-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.plans)) state.plans = MOCK
      },
    }
  )
)
