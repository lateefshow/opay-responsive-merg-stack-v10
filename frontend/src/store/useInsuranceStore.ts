import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InsurancePolicy } from '@/types'
import { addMonths } from '@/lib/utils'

const MOCK: InsurancePolicy[] = [
  {
    id:'ins1', userId:'', type:'health', name:'Health Shield Basic',
    provider:'AXA Mansard', premium:3500, frequency:'monthly', coverage:5000000,
    startDate:new Date(Date.now()-86400000*60).toISOString(),
    endDate:addMonths(new Date(), 10).toISOString(), status:'active',
    policyNumber:'AXA-HLT-0012345',
    benefits:['Outpatient care','Specialist consultations','Emergency evacuation','Dental cover'],
    createdAt:new Date(Date.now()-86400000*60).toISOString(),
  },
]

interface State {
  policies: InsurancePolicy[]
  addPolicy: (p: InsurancePolicy) => void
  cancelPolicy: (id: string) => void
  activeCount: () => number
}

export const useInsuranceStore = create<State>()(
  persist(
    (set, get) => ({
      policies: MOCK,
      addPolicy: (p) => set(s => ({ policies: [p, ...(s.policies ?? [])] })),
      cancelPolicy: (id) => set(s => ({
        policies: (s.policies ?? []).map(p =>
          p.id === id ? { ...p, status: 'cancelled' as const } : p
        ),
      })),
      activeCount: () => (get().policies ?? []).filter(p => p.status === 'active').length,
    }),
    {
      name: 'opay-insurance-v5',
      onRehydrateStorage: () => (state) => {
        if (state && !Array.isArray(state.policies)) state.policies = MOCK
      },
    }
  )
)
