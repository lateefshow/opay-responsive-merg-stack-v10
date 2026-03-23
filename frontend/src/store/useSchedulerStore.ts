import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScheduledPayment } from '@/types'

const MOCK: ScheduledPayment[] = [
  {
    id:'sc1', userId:'', type:'bill', name:'DSTV Compact Monthly',
    amount:7900, billCategory:'tv', frequency:'monthly',
    nextRunDate:new Date(Date.now()+604800000).toISOString(),
    active:true, createdAt:new Date().toISOString(),
  },
  {
    id:'sc2', userId:'', type:'savings', name:'OWealth Auto-Save',
    amount:5000, frequency:'weekly',
    nextRunDate:new Date(Date.now()+172800000).toISOString(),
    active:true, createdAt:new Date().toISOString(),
  },
]

interface State {
  payments: ScheduledPayment[]
  addPayment: (p: ScheduledPayment) => void
  toggleActive: (id: string) => void
  deletePayment: (id: string) => void
  updatePayment: (id: string, u: Partial<ScheduledPayment>) => void
}

export const useSchedulerStore = create<State>()(
  persist(
    (set) => ({
      payments: MOCK,
      addPayment: (p) => set(s => ({ payments: [p, ...(s.payments ?? [])] })),
      toggleActive: (id) => set(s => ({
        payments: (s.payments ?? []).map(p => p.id === id ? { ...p, active: !p.active } : p),
      })),
      deletePayment: (id) => set(s => ({
        payments: (s.payments ?? []).filter(p => p.id !== id),
      })),
      updatePayment: (id, u) => set(s => ({
        payments: (s.payments ?? []).map(p => p.id === id ? { ...p, ...u } : p),
      })),
    }),
    {
      name: 'opay-scheduler-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.payments)) state.payments = MOCK
      },
    }
  )
)
