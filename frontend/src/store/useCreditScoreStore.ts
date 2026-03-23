import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { CreditFactor, CreditHistory } from '@/types'

const FALLBACK_FACTORS: CreditFactor[] = [
  { label:'Payment History',    score:85, maxScore:100, status:'good', tip:'You have paid 17/18 loans on time. Keep it up!'          },
  { label:'Credit Utilization', score:72, maxScore:100, status:'good', tip:'Using 28% of your credit limit. Aim for below 30%.'      },
  { label:'Credit Age',         score:60, maxScore:100, status:'fair', tip:'Your oldest account is 8 months. Age improves over time.' },
  { label:'Credit Mix',         score:68, maxScore:100, status:'fair', tip:'You have loans only. Adding a card improves this.'        },
  { label:'New Inquiries',      score:90, maxScore:100, status:'good', tip:'Only 1 hard inquiry in the last 12 months. Excellent!'    },
  { label:'Total Debt',         score:55, maxScore:100, status:'fair', tip:'Reduce outstanding loan balance to improve this factor.'  },
]
const FALLBACK_HISTORY: CreditHistory[] = [
  {month:'Sep 2025',score:698},{month:'Oct 2025',score:712},{month:'Nov 2025',score:705},
  {month:'Dec 2025',score:718},{month:'Jan 2026',score:725},{month:'Feb 2026',score:730},{month:'Mar 2026',score:742},
]

interface State {
  score: number
  tier: 'poor'|'fair'|'good'|'excellent'
  factors: CreditFactor[]
  history: CreditHistory[]
  lastUpdated: string
  isLoading: boolean
  fetchScore: () => Promise<void>
  simulateImprovement: (action: string) => Promise<void>
}

export const useCreditScoreStore = create<State>()(
  persist(
    (set) => ({
      score: 742, tier:'good', factors:FALLBACK_FACTORS, history:FALLBACK_HISTORY,
      lastUpdated:new Date().toISOString(), isLoading:false,
      fetchScore: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/credit-score')
          const cs = data.data
          set({ score:cs.score, tier:cs.tier, factors:cs.factors??FALLBACK_FACTORS, history:cs.history??FALLBACK_HISTORY, lastUpdated:cs.lastUpdated })
        } catch { /* use persisted data */ } finally { set({ isLoading:false }) }
      },
      simulateImprovement: async (action: string) => {
        try {
          const { data } = await api.post('/credit-score/simulate', { action })
          const cs = data.data
          set({ score:cs.score, tier:cs.tier, lastUpdated:cs.lastUpdated })
        } catch { /* local fallback */ }
      },
    }),
    {
      name:'opay-credit-v10',
      onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.factors)){s.factors=FALLBACK_FACTORS;s.history=FALLBACK_HISTORY} },
    }
  )
)
