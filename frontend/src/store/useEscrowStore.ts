import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface EscrowMilestone { id:string; title:string; description:string; amount:number; status:string; releasedAt?:string }
export interface EscrowContract { id:string; buyerId:string; sellerEmail:string; sellerName:string; title:string; description:string; totalAmount:number; amountHeld:number; amountReleased:number; milestones:EscrowMilestone[]; status:string; createdAt:string }
interface CreatePayload { sellerEmail:string; sellerName:string; title:string; description:string; milestones:Array<{title:string;description:string;amount:number}> }
interface State {
  contracts: EscrowContract[]; totalHeld: number; isLoading: boolean
  fetchEscrows: () => Promise<void>
  createEscrow: (p:CreatePayload) => Promise<{contract:EscrowContract;fee:number}>
  releaseMilestone: (contractId:string, milestoneId:string) => Promise<EscrowContract>
  cancelEscrow: (id:string) => Promise<void>
}
export const useEscrowStore = create<State>()(
  persist(
    (set) => ({
      contracts:[], totalHeld:0, isLoading:false,
      fetchEscrows: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/escrow'); set({ contracts:data.data.contracts??[], totalHeld:data.data.totalHeld??0 }) }
        catch {} finally { set({ isLoading:false }) }
      },
      createEscrow: async (payload) => {
        const { data } = await api.post('/escrow', payload)
        const contract: EscrowContract = data.data.contract
        set(s => ({ contracts:[contract,...(s.contracts??[])], totalHeld:(s.totalHeld??0)+contract.amountHeld }))
        return { contract, fee:data.data.fee??0 }
      },
      releaseMilestone: async (contractId, milestoneId) => {
        const { data } = await api.post(`/escrow/${contractId}/release`, { milestoneId })
        const updated: EscrowContract = data.data
        set(s => ({ contracts:(s.contracts??[]).map(c => c.id===contractId?updated:c) }))
        return updated
      },
      cancelEscrow: async (id) => {
        await api.delete(`/escrow/${id}`)
        set(s => ({ contracts:(s.contracts??[]).map(c => c.id===id?{...c,status:'cancelled',amountHeld:0}:c) }))
      },
    }),
    { name:'opay-escrow-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.contracts))s.contracts=[] } }
  )
)
