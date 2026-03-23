import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface PaymentLink { id:string; title:string; description:string; amount:number; isFixedAmount:boolean; slug:string; url:string; status:string; expiresAt?:string; totalCollected:number; paymentCount:number; createdAt:string }
interface CreatePayload { title:string; description:string; amount:number; isFixedAmount:boolean; expiresAt?:string }
interface State {
  links: PaymentLink[]; totalCollected: number; isLoading: boolean
  fetchLinks: () => Promise<void>
  createLink: (p:CreatePayload) => Promise<PaymentLink>
  toggleLink: (id:string) => Promise<void>
  deleteLink: (id:string) => Promise<void>
  simulatePayment: (id:string, amount:number, name:string, email:string) => Promise<void>
}
export const usePaymentLinkStore = create<State>()(
  persist(
    (set) => ({
      links:[], totalCollected:0, isLoading:false,
      fetchLinks: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/payment-links'); set({ links:data.data.links??[], totalCollected:data.data.totalCollected??0 }) }
        catch {} finally { set({ isLoading:false }) }
      },
      createLink: async (payload) => {
        const { data } = await api.post('/payment-links', payload)
        const link: PaymentLink = data.data
        set(s => ({ links:[link,...(s.links??[])] }))
        return link
      },
      toggleLink: async (id) => {
        const { data } = await api.patch(`/payment-links/${id}/toggle`)
        const newStatus: string = data.data.status
        set(s => ({ links:(s.links??[]).map(l => l.id===id?{...l,status:newStatus}:l) }))
      },
      deleteLink: async (id) => {
        await api.delete(`/payment-links/${id}`)
        set(s => ({ links:(s.links??[]).filter(l => l.id!==id) }))
      },
      simulatePayment: async (id, amount, name, email) => {
        await api.post(`/payment-links/${id}/simulate`, { amount, name, email })
        set(s => ({ links:(s.links??[]).map(l => l.id===id?{...l,totalCollected:l.totalCollected+amount,paymentCount:l.paymentCount+1}:l), totalCollected:(s.totalCollected??0)+amount }))
      },
    }),
    { name:'opay-paylinks-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.links))s.links=[] } }
  )
)
