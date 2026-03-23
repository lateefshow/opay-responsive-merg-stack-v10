import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface BillProvider { id:string; name:string; logo:string }
export interface BillPayment { id:string; category:string; provider:string; accountNum:string; amount:number; token?:string; reference:string; status:string; createdAt:string }
interface State {
  history: BillPayment[]; totalSpent: number; providers: Record<string, BillProvider[]>; isLoading: boolean
  fetchAll: () => Promise<void>
  payBill: (category:string, provider:string, accountNum:string, amount:number) => Promise<BillPayment>
}
export const useBillPaymentStore = create<State>()(
  persist(
    (set) => ({
      history:[], totalSpent:0, providers:{}, isLoading:false,
      fetchAll: async () => {
        set({ isLoading:true })
        try {
          const [hist, prov] = await Promise.all([api.get('/bills-history'), api.get('/bill-providers')])
          set({ history:hist.data.data.history??[], totalSpent:hist.data.data.totalSpent??0, providers:prov.data.data.all??{} })
        } catch {} finally { set({ isLoading:false }) }
      },
      payBill: async (category, provider, accountNum, amount) => {
        const { data } = await api.post('/bills/pay', { category, provider, accountNum, amount })
        const payment = data.data.payment
        set(s => ({ history:[payment,...(s.history??[])], totalSpent:(s.totalSpent??0)+payment.amount }))
        return { ...payment, token: data.data.token }
      },
    }),
    { name:'opay-bills-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.history))s.history=[] } }
  )
)
