import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

interface BankAccount { id:string; bankName:string; bankCode:string; accountNumber:string; accountName:string; isDefault:boolean; createdAt:string }
interface WireTransfer { id:string; bankName:string; accountNumber:string; accountName:string; amount:number; fee:number; narration:string; reference:string; status:string; createdAt:string }
interface NigerianBank { code:string; name:string }
interface State {
  accounts: BankAccount[]; banks: NigerianBank[]; transfers: WireTransfer[]
  totalSent: number; isLoading: boolean
  fetchAll: () => Promise<void>
  addAccount: (bankName:string, bankCode:string, accountNumber:string, accountName:string) => Promise<BankAccount>
  sendWire: (p:{bankCode:string;accountNumber:string;accountName:string;bankName:string;amount:number;narration:string}) => Promise<WireTransfer>
}
export const useWireTransferStore = create<State>()(
  persist(
    (set) => ({
      accounts:[], banks:[], transfers:[], totalSent:0, isLoading:false,
      fetchAll: async () => {
        set({ isLoading:true })
        try {
          const [a, h] = await Promise.all([api.get('/wire-transfer/banks'), api.get('/wire-transfer/history')])
          set({ accounts:a.data.data.accounts??[], banks:a.data.data.banks??[], transfers:h.data.data.transfers??[], totalSent:h.data.data.totalSent??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      addAccount: async (bankName, bankCode, accountNumber, accountName) => {
        const { data } = await api.post('/wire-transfer/banks', { bankName, bankCode, accountNumber, accountName })
        set(s => ({ accounts:[data.data,...(s.accounts??[])] }))
        return data.data
      },
      sendWire: async (payload) => {
        const { data } = await api.post('/wire-transfer/send', payload)
        const t = data.data.transfer
        set(s => ({ transfers:[t,...(s.transfers??[])], totalSent:(s.totalSent??0)+t.amount }))
        return t
      },
    }),
    { name:'opay-wire-v10', onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.accounts))s.accounts=[];if(!Array.isArray(s.transfers))s.transfers=[];if(!Array.isArray(s.banks))s.banks=[]} } }
  )
)
