import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { SplitRequest, SplitParticipant } from '@/types'

interface CreateSplitPayload { title:string; description:string; totalAmount:number; participants:SplitParticipant[] }

interface State {
  splits: SplitRequest[]
  isLoading: boolean
  fetchSplits:    () => Promise<void>
  createSplit:    (p:CreateSplitPayload) => Promise<SplitRequest>
  markPaid:       (splitId:string, userId:string) => Promise<void>
  cancelSplit:    (id:string) => Promise<void>
}

export const useSplitPayStore = create<State>()(
  persist(
    (set, get) => ({
      splits:[], isLoading:false,
      fetchSplits: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/split-pay')
          set({ splits: data.data.splits ?? [] })
        } catch {} finally { set({ isLoading:false }) }
      },
      createSplit: async (payload) => {
        const { data } = await api.post('/split-pay', payload)
        const s: SplitRequest = data.data
        set(st => ({ splits:[s,...(st.splits??[])] }))
        return s
      },
      markPaid: async (splitId, userId) => {
        const { data } = await api.post(`/split-pay/${splitId}/mark-paid`, { userId })
        const updated: SplitRequest = data.data
        set(st => ({ splits:(st.splits??[]).map(s => s.id===splitId ? updated : s) }))
      },
      cancelSplit: async (id) => {
        await api.delete(`/split-pay/${id}`)
        set(st => ({ splits:(st.splits??[]).map(s => s.id===id ? {...s,status:'cancelled' as const} : s) }))
      },
    }),
    {
      name:'opay-splitpay-v10',
      onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.splits))s.splits=[] },
    }
  )
)
