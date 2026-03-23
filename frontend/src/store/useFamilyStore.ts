import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface FamilyMember { userId:string; name:string; email:string; role:string; avatarColor:string; initials:string; spendLimit:number; spentThisMonth:number; joinedAt:string }
export interface FamilyAccount { id:string; ownerId:string; name:string; sharedBalance:number; members:FamilyMember[]; totalMonthlySpend:number; createdAt:string }
interface State {
  account: FamilyAccount|null; isLoading: boolean
  fetchFamily: () => Promise<void>
  createFamily: (name:string) => Promise<FamilyAccount>
  inviteMember: (email:string, name:string, spendLimit:number) => Promise<FamilyMember>
  fundFamily: (amount:number) => Promise<void>
  setSpendLimit: (email:string, limit:number) => Promise<void>
}
export const useFamilyStore = create<State>()(
  persist(
    (set) => ({
      account:null, isLoading:false,
      fetchFamily: async () => {
        set({ isLoading:true })
        try { const { data } = await api.get('/family'); set({ account:data.data }) }
        catch {} finally { set({ isLoading:false }) }
      },
      createFamily: async (name) => {
        const { data } = await api.post('/family', { name }); set({ account:data.data }); return data.data
      },
      inviteMember: async (email, name, spendLimit) => {
        const { data } = await api.post('/family/invite', { email, name, spendLimit })
        const member: FamilyMember = data.data
        set(s => ({ account:s.account?{...s.account,members:[...s.account.members,member]}:null }))
        return member
      },
      fundFamily: async (amount) => {
        await api.post('/family/fund', { amount })
        set(s => ({ account:s.account?{...s.account,sharedBalance:(s.account.sharedBalance??0)+amount}:null }))
      },
      setSpendLimit: async (email, limit) => {
        await api.patch(`/family/members/${email}/limit`, { spendLimit:limit })
        set(s => ({ account:s.account?{...s.account,members:s.account.members.map(m=>m.email===email?{...m,spendLimit:limit}:m)}:null }))
      },
    }),
    { name:'opay-family-v10', onRehydrateStorage:()=>()=>{} }
  )
)
