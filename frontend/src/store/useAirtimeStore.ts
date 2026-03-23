import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface DataPlan { id:string; label:string; amount:number }
export interface AirtimePurchase { id:string; network:string; phone:string; amount:number; planType:string; dataPlan?:string; reference:string; status:string; createdAt:string }
interface State {
  history: AirtimePurchase[]; totalSpent: number; dataPlans: DataPlan[]; isLoading: boolean
  fetchHistory: () => Promise<void>
  fetchDataPlans: (network:string) => Promise<DataPlan[]>
  buyAirtime: (network:string, phone:string, amount:number, planType:string, dataPlan?:string) => Promise<AirtimePurchase>
}
export const useAirtimeStore = create<State>()(
  persist(
    (set) => ({
      history:[], totalSpent:0, dataPlans:[], isLoading:false,
      fetchHistory: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/airtime/history'); set({ history:data.data.history??[], totalSpent:data.data.totalSpent??0 }) }
        catch {} finally { set({ isLoading:false }) }
      },
      fetchDataPlans: async (network) => {
        const { data } = await api.get(`/airtime/plans?network=${network}`)
        const plans = data.data.plans ?? []
        set({ dataPlans:plans }); return plans
      },
      buyAirtime: async (network, phone, amount, planType, dataPlan) => {
        const { data } = await api.post('/airtime/buy', { network, phone, amount, planType, dataPlan: dataPlan||'' })
        const purchase = data.data.purchase
        set(s => ({ history:[purchase,...(s.history??[])], totalSpent:(s.totalSpent??0)+purchase.amount }))
        return purchase
      },
    }),
    { name:'opay-airtime-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.history))s.history=[] } }
  )
)
