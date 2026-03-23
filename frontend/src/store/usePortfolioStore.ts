import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface PortfolioHolding { id:string; symbol:string; name:string; type:string; quantity:number; avgBuyPrice:number; currentPrice:number; totalCost:number; currentValue:number; pnl:number; pnlPercent:number; color:string; createdAt:string }
interface State {
  holdings: PortfolioHolding[]; totalValue: number; totalCost: number; totalPnL: number; totalPnLPercent: number; isLoading: boolean
  fetchPortfolio: () => Promise<void>
  buyAsset: (p:{symbol:string;name:string;type:string;quantity:number;price:number;color:string}) => Promise<void>
  sellAsset: (id:string, quantity:number) => Promise<void>
}
export const usePortfolioStore = create<State>()(
  persist(
    (set) => ({
      holdings:[], totalValue:0, totalCost:0, totalPnL:0, totalPnLPercent:0, isLoading:false,
      fetchPortfolio: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/portfolio')
          const d = data.data
          set({ holdings:d.holdings??[], totalValue:d.totalValue??0, totalCost:d.totalCost??0, totalPnL:d.totalPnL??0, totalPnLPercent:d.totalPnLPercent??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      buyAsset: async (payload) => {
        await api.post('/portfolio/buy', payload)
      },
      sellAsset: async (id, quantity) => {
        await api.post(`/portfolio/${id}/sell`, { quantity })
      },
    }),
    { name:'opay-portfolio-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.holdings))s.holdings=[] } }
  )
)
