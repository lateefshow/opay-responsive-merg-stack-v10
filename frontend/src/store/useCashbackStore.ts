import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CashbackOffer, CashbackEarned } from '@/types'

const OFFERS: CashbackOffer[] = [
  { id:'cb1', merchant:'Jumia',       percentage:5,  category:'Shopping',     maxAmount:2500, validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#f97316' },
  { id:'cb2', merchant:'Uber',        percentage:10, category:'Transport',    maxAmount:1500, validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#111827' },
  { id:'cb3', merchant:'Netflix',     percentage:8,  category:'Entertainment',maxAmount:1000, validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#ef4444' },
  { id:'cb4', merchant:'MTN Airtime', percentage:3,  category:'Airtime',      maxAmount:500,  validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#f59e0b' },
  { id:'cb5', merchant:'DSTV',        percentage:5,  category:'Bills',        maxAmount:800,  validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#2563eb' },
  { id:'cb6', merchant:'Konga',       percentage:7,  category:'Shopping',     maxAmount:3000, validUntil:new Date(Date.now()+2592000000).toISOString(), color:'#dc2626' },
]

interface State {
  offers: CashbackOffer[]
  earned: CashbackEarned[]
  totalEarned: () => number
  addEarned: (e: CashbackEarned) => void
}

export const useCashbackStore = create<State>()(
  persist(
    (set, get) => ({
      offers: OFFERS,
      earned: [],
      totalEarned: () => (get().earned ?? []).reduce((s, e) => s + e.amount, 0),
      addEarned: (e) => set(s => ({ earned: [e, ...(s.earned ?? [])] })),
    }),
    {
      name: 'opay-cashback-v5',
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!Array.isArray(state.offers)) state.offers = OFFERS
          if (!Array.isArray(state.earned)) state.earned = []
        }
      },
    }
  )
)
