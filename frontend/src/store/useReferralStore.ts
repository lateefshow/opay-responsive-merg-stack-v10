import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

interface ReferralEntry { id:string; refereeName:string; bonusAmount:number; status:string; joinedAt:string }
interface Stats { totalReferrals:number; paidBonuses:number; pendingBonuses:number; totalEarned:number; tierLevel:string; nextTierAt:number }
interface Milestone { referrals:number; reward:number; bonus:string }
interface State {
  referralCode: string; referralLink: string; shareMessage: string
  stats: Stats; referrals: ReferralEntry[]; milestones: Milestone[]
  bonusPerReferral: number; isLoading: boolean
  fetch: () => Promise<void>; getShareLink: () => Promise<string>
}
export const useReferralStore = create<State>()(
  persist(
    (set) => ({
      referralCode:'', referralLink:'', shareMessage:'', bonusPerReferral:3000,
      stats:{totalReferrals:0,paidBonuses:0,pendingBonuses:0,totalEarned:0,tierLevel:'Bronze',nextTierAt:5},
      referrals:[], milestones:[], isLoading:false,
      fetch: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/referral-center')
          const d = data.data
          set({ referralCode:d.referralCode, referralLink:d.referralLink, stats:d.stats, referrals:d.referrals??[], milestones:d.milestones??[], bonusPerReferral:d.bonusPerReferral??3000 })
        } catch {} finally { set({ isLoading:false }) }
      },
      getShareLink: async () => {
        const { data } = await api.get('/referral-center/share')
        set({ shareMessage:data.data.message })
        return data.data.message
      },
    }),
    { name:'opay-referral-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.referrals))s.referrals=[] } }
  )
)
