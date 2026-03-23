import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { Subscription } from '@/types'

interface AddSubPayload { name:string;logo:string;color:string;category:string;amount:number;frequency:'monthly'|'quarterly'|'annual';cardLast4:string }

interface State {
  subscriptions: Subscription[]
  monthlyTotal:  number
  isLoading:     boolean
  fetchSubscriptions: () => Promise<void>
  addSubscription:    (p:AddSubPayload) => Promise<Subscription>
  togglePause:        (id:string) => Promise<void>
  cancelSubscription: (id:string) => Promise<void>
  totalMonthly:       () => number
}

export const useSubscriptionStore = create<State>()(
  persist(
    (set, get) => ({
      subscriptions:[], monthlyTotal:0, isLoading:false,
      fetchSubscriptions: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/subscriptions')
          set({ subscriptions:data.data.subscriptions??[], monthlyTotal:data.data.monthlyTotal??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      addSubscription: async (payload) => {
        const { data } = await api.post('/subscriptions', payload)
        const s: Subscription = data.data
        set(st => ({ subscriptions:[s,...(st.subscriptions??[])] }))
        return s
      },
      togglePause: async (id) => {
        const { data } = await api.patch(`/subscriptions/${id}/toggle`)
        const updated: Subscription = data.data
        set(st => ({ subscriptions:(st.subscriptions??[]).map(s => s.id===id ? updated : s) }))
      },
      cancelSubscription: async (id) => {
        await api.delete(`/subscriptions/${id}`)
        set(st => ({ subscriptions:(st.subscriptions??[]).map(s => s.id===id?{...s,status:'cancelled' as const}:s) }))
      },
      totalMonthly: () => {
        return (get().subscriptions??[])
          .filter(s=>s.status==='active'||s.status==='trial')
          .reduce((sum,s)=>{
            switch(s.frequency){case'monthly':return sum+s.amount;case'quarterly':return sum+s.amount/3;case'annual':return sum+s.amount/12;default:return sum}
          }, 0)
      },
    }),
    {
      name:'opay-subscriptions-v10',
      onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.subscriptions))s.subscriptions=[] },
    }
  )
)
