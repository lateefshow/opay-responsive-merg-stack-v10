import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Budget, BudgetCategory } from '@/types'
import { CATEGORY_COLORS } from '@/lib/utils'

const makeDefault = (): Budget => ({
  id: 'budget-default',
  userId: '',
  name: 'Monthly Budget',
  totalBudget: 200000,
  spent: 0,
  month: new Date().toISOString().slice(0, 7),
  categories: [
    { category:'Food & Dining',    allocated:50000, spent:32000, color:CATEGORY_COLORS[0] },
    { category:'Transport',        allocated:20000, spent:15000, color:CATEGORY_COLORS[1] },
    { category:'Entertainment',    allocated:15000, spent:8000,  color:CATEGORY_COLORS[2] },
    { category:'Bills & Utilities',allocated:40000, spent:38000, color:CATEGORY_COLORS[3] },
    { category:'Shopping',         allocated:30000, spent:12000, color:CATEGORY_COLORS[4] },
    { category:'Healthcare',       allocated:20000, spent:5000,  color:CATEGORY_COLORS[5] },
    { category:'Savings',          allocated:25000, spent:25000, color:CATEGORY_COLORS[6] },
  ],
  createdAt: new Date().toISOString(),
})

interface State {
  budget: Budget
  updateCategory: (cat: string, updates: Partial<BudgetCategory>) => void
  updateTotal: (amount: number) => void
  resetMonth: () => void
}

export const useBudgetStore = create<State>()(
  persist(
    (set) => ({
      budget: makeDefault(),
      updateCategory: (cat, updates) => set(s => ({
        budget: {
          ...s.budget,
          categories: (s.budget?.categories ?? []).map(c =>
            c.category === cat ? { ...c, ...updates } : c
          ),
        },
      })),
      updateTotal: (amount) => set(s => ({ budget: { ...s.budget, totalBudget: amount } })),
      resetMonth: () => set({ budget: makeDefault() }),
    }),
    {
      name: 'opay-budget-v5',
      onRehydrateStorage: () => (state) => {
        if (state && (!state.budget || !Array.isArray(state.budget.categories))) {
          state.budget = makeDefault()
        }
      },
    }
  )
)
