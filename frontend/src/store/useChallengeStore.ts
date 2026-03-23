import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface CatalogueChallenge { id:string; name:string; type:string; description:string; targetAmount:number; duration:number; durationUnit:string; reward:number; milestones:any[]; joined:boolean }
export interface UserChallenge { id:string; challengeId:string; name:string; type:string; description:string; targetAmount:number; currentAmount:number; duration:number; durationUnit:string; reward:number; status:string; progress:number; startDate:string; endDate:string; milestones:Array<{label:string;target:number;reward:number;achieved:boolean}> }
interface State {
  available: CatalogueChallenge[]; joined: UserChallenge[]
  totalRewards: number; completedCount: number; activeCount: number; isLoading: boolean
  fetchChallenges: () => Promise<void>
  joinChallenge: (challengeId:string) => Promise<UserChallenge>
  updateProgress: (id:string, amount:number) => Promise<UserChallenge>
  abandonChallenge: (id:string) => Promise<void>
}
export const useChallengeStore = create<State>()(
  persist(
    (set) => ({
      available:[], joined:[], totalRewards:0, completedCount:0, activeCount:0, isLoading:false,
      fetchChallenges: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/challenges')
          const d = data.data
          set({ available:d.available??[], joined:d.joined??[], totalRewards:d.totalRewards??0, completedCount:d.completedCount??0, activeCount:d.activeCount??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      joinChallenge: async (challengeId) => {
        const { data } = await api.post('/challenges/join', { challengeId })
        const uc: UserChallenge = data.data
        set(s => ({
          joined:[uc,...(s.joined??[])],
          available:(s.available??[]).map(a => a.id===challengeId?{...a,joined:true}:a),
          activeCount:(s.activeCount??0)+1,
        }))
        return uc
      },
      updateProgress: async (id, amount) => {
        const { data } = await api.post(`/challenges/${id}/progress`, { amount })
        const updated: UserChallenge = data.data
        set(s => ({ joined:(s.joined??[]).map(j => j.id===id?updated:j) }))
        return updated
      },
      abandonChallenge: async (id) => {
        await api.delete(`/challenges/${id}`)
        set(s => ({ joined:(s.joined??[]).map(j => j.id===id?{...j,status:'abandoned'}:j), activeCount:Math.max(0,(s.activeCount??1)-1) }))
      },
    }),
    { name:'opay-challenges-v10', onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.available))s.available=[];if(!Array.isArray(s.joined))s.joined=[]} } }
  )
)
