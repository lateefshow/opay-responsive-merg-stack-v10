import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface AlertRule { id:string; name:string; trigger:string; threshold:number; channel:string; isActive:boolean; triggeredCount:number; lastTriggered?:string; createdAt:string }
interface State {
  rules: AlertRule[]; isLoading: boolean
  fetchRules: () => Promise<void>
  createRule: (name:string, trigger:string, threshold:number, channel:string) => Promise<AlertRule>
  toggleRule: (id:string) => Promise<void>
  deleteRule: (id:string) => Promise<void>
}
export const useAlertStore = create<State>()(
  persist(
    (set) => ({
      rules:[], isLoading:false,
      fetchRules: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/alerts'); set({ rules:data.data.rules??[] }) }
        catch {} finally { set({ isLoading:false }) }
      },
      createRule: async (name, trigger, threshold, channel) => {
        const { data } = await api.post('/alerts', { name, trigger, threshold, channel })
        const rule: AlertRule = data.data
        set(s => ({ rules:[rule,...(s.rules??[])] }))
        return rule
      },
      toggleRule: async (id) => {
        const { data } = await api.patch(`/alerts/${id}/toggle`)
        const active: boolean = data.data.isActive
        set(s => ({ rules:(s.rules??[]).map(r => r.id===id?{...r,isActive:active}:r) }))
      },
      deleteRule: async (id) => {
        await api.delete(`/alerts/${id}`)
        set(s => ({ rules:(s.rules??[]).filter(r => r.id!==id) }))
      },
    }),
    { name:'opay-alerts-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.rules))s.rules=[] } }
  )
)
