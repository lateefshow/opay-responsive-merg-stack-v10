import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { RemittanceRecipient, RemittanceTransaction } from '@/types'

export const REMITTANCE_RATES: Record<string,{rate:number;fee:number;time:string;flag:string}> = {
  GHS:{rate:0.00793,fee:1500,time:'1-2 hrs',flag:'🇬🇭'},
  GBP:{rate:0.000493,fee:2500,time:'1-3 days',flag:'🇬🇧'},
  USD:{rate:0.000633,fee:2000,time:'1-2 days',flag:'🇺🇸'},
  EUR:{rate:0.000581,fee:2000,time:'1-2 days',flag:'🇪🇺'},
  CAD:{rate:0.000862,fee:2000,time:'2-3 days',flag:'🇨🇦'},
  AED:{rate:0.002324,fee:2500,time:'1-2 days',flag:'🇦🇪'},
  XOF:{rate:0.381,fee:1500,time:'2-4 hrs',flag:'🇸🇳'},
}

interface SendPayload { recipientId:string; sendAmount:number; currency:string }
interface AddRecipientPayload { name:string; country:string; flag:string; bank:string; accountNumber:string; currency:string }

interface State {
  recipients:   RemittanceRecipient[]
  transactions: RemittanceTransaction[]
  isLoading:    boolean
  fetchRecipients:   () => Promise<void>
  fetchHistory:      () => Promise<void>
  addRecipient:      (p:AddRecipientPayload) => Promise<RemittanceRecipient>
  toggleFavorite:    (id:string) => Promise<void>
  sendRemittance:    (p:SendPayload) => Promise<RemittanceTransaction>
}

export const useRemittanceStore = create<State>()(
  persist(
    (set) => ({
      recipients:[], transactions:[], isLoading:false,
      fetchRecipients: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/remittance/recipients')
          set({ recipients: data.data.recipients ?? [] })
        } catch {} finally { set({ isLoading:false }) }
      },
      fetchHistory: async () => {
        try {
          const { data } = await api.get('/remittance/history')
          set({ transactions: data.data.transactions ?? [] })
        } catch {}
      },
      addRecipient: async (payload) => {
        const { data } = await api.post('/remittance/recipients', payload)
        const r: RemittanceRecipient = data.data
        set(s => ({ recipients:[r,...(s.recipients??[])] }))
        return r
      },
      toggleFavorite: async (id) => {
        await api.patch(`/remittance/recipients/${id}/favourite`)
        set(s => ({ recipients:(s.recipients??[]).map(r => r.id===id?{...r,isFavorite:!r.isFavorite}:r) }))
      },
      sendRemittance: async (payload) => {
        const { data } = await api.post('/remittance/send', payload)
        const tx: RemittanceTransaction = data.data.transaction
        set(s => ({ transactions:[tx,...(s.transactions??[])] }))
        return tx
      },
    }),
    {
      name:'opay-remittance-v10',
      onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.recipients))s.recipients=[];if(!Array.isArray(s.transactions))s.transactions=[]} },
    }
  )
)
