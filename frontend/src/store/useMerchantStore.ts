import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { MerchantProfile, MerchantTransaction } from '@/types'

interface State {
  profile: MerchantProfile | null
  transactions: MerchantTransaction[]
  totalReceived: number
  todayAmount: number
  isLoading: boolean
  fetchProfile: () => Promise<void>
  fetchTransactions: () => Promise<void>
  createProfile: (businessName: string, category: string, description: string) => Promise<MerchantProfile>
  receivePayment: (amount: number, description: string) => Promise<MerchantTransaction>
}

export const useMerchantStore = create<State>()(
  persist(
    (set) => ({
      profile: null, transactions: [], totalReceived: 0, todayAmount: 0, isLoading: false,
      fetchProfile: async () => {
        set({ isLoading: true })
        try {
          const { data } = await api.get('/merchant/profile')
          set({ profile: data.data })
        } catch {} finally { set({ isLoading: false }) }
      },
      fetchTransactions: async () => {
        try {
          const { data } = await api.get('/merchant/transactions')
          set({ transactions: data.data.transactions ?? [], totalReceived: data.data.totalReceived ?? 0, todayAmount: data.data.todayAmount ?? 0 })
        } catch {}
      },
      createProfile: async (businessName, category, description) => {
        const { data } = await api.post('/merchant/profile', { businessName, category, description })
        set({ profile: data.data })
        return data.data
      },
      receivePayment: async (amount, description) => {
        const { data } = await api.post('/merchant/receive', { amount, description })
        const tx: MerchantTransaction = data.data.transaction
        set(s => ({
          transactions: [tx, ...(s.transactions ?? [])],
          totalReceived: (s.totalReceived ?? 0) + tx.netAmount,
          todayAmount:   (s.todayAmount ?? 0) + tx.netAmount,
        }))
        return tx
      },
    }),
    {
      name: 'opay-merchant-v10',
      onRehydrateStorage: () => (s) => { if (s && !Array.isArray(s.transactions)) s.transactions = [] },
    }
  )
)
