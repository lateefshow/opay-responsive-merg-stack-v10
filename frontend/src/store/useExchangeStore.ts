import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ExchangeTransaction } from '@/types'

const RATES: Record<string, number> = {
  'NGN-USD':0.000633,'NGN-GBP':0.000493,'NGN-EUR':0.000581,
  'USD-NGN':1580,'GBP-NGN':2028,'EUR-NGN':1720,
  'NGN-GHS':0.0079,'NGN-KES':0.082,
}

interface State {
  transactions: ExchangeTransaction[]
  getRate: (from: string, to: string) => number
  addTransaction: (t: ExchangeTransaction) => void
}

export const useExchangeStore = create<State>()(
  persist(
    (set, get) => ({
      transactions: [],
      getRate: (from, to) => RATES[`${from}-${to}`] ?? 1,
      addTransaction: (t) => set(s => ({ transactions: [t, ...(s.transactions ?? [])] })),
    }),
    {
      name: 'opay-exchange-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.transactions)) state.transactions = []
      },
    }
  )
)
