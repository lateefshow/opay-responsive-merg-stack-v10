import { create } from 'zustand'
import api from '@/lib/axios'
import type { Transaction } from '@/types'

interface WalletState {
  balance: number
  transactions: Transaction[]
  totalTransactions: number
  isLoading: boolean
  fetchBalance: () => Promise<void>
  fetchTransactions: (page?: number, reset?: boolean) => Promise<void>
  fund: (amount: number) => Promise<void>
  transfer: (email: string, amount: number, note?: string) => Promise<void>
  setBalance: (b: number) => void
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: 0,
  transactions: [],
  totalTransactions: 0,
  isLoading: false,

  setBalance: (b) => set({ balance: b }),

  fetchBalance: async () => {
    try {
      const { data } = await api.get('/wallet/balance')
      set({ balance: data.data.balance ?? 0 })
    } catch { /* silent */ }
  },

  fetchTransactions: async (page = 1, reset = false) => {
    set({ isLoading: true })
    try {
      const { data } = await api.get(`/wallet/transactions?page=${page}&limit=20`)
      // Guard: backend may return null instead of [] for new users
      const txs: Transaction[] = data.data.transactions ?? []
      const total: number = data.data.total ?? 0
      set(s => ({
        transactions: reset || page === 1 ? txs : [...s.transactions, ...txs],
        totalTransactions: total,
      }))
    } catch { /* silent */ } finally {
      set({ isLoading: false })
    }
  },

  fund: async (amount) => {
    const { data } = await api.post('/wallet/fund', { amount })
    set({ balance: data.data.newBalance ?? 0 })
    get().fetchTransactions(1, true)
  },

  transfer: async (recipientEmail, amount, note) => {
    const { data } = await api.post('/wallet/transfer/opay', { recipientEmail, amount, note })
    set({ balance: data.data.newBalance ?? 0 })
    get().fetchTransactions(1, true)
  },
}))
