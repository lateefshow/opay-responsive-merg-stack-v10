import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

interface TaxBracket { label:string; rate:number; from:number; to:number; tax:number }
interface TaxYear { id:string; year:number; grossIncome:number; taxableIncome:number; taxOwed:number; deductions:number; taxPaid:number; status:string; breakdown:TaxBracket[] }
interface TaxDocument { id:string; docType:string; name:string; status:string; createdAt:string }
interface TaxSummary { grossIncome:number; deductions:number; taxableIncome:number; taxOwed:number; taxPaid:number; balance:number }
interface State {
  taxYear: TaxYear|null; documents: TaxDocument[]; summary: TaxSummary|null
  effectiveRate: number; isLoading: boolean
  fetchTax: () => Promise<void>
  computeTax: (grossIncome:number, deductions:number, year:number) => Promise<{taxOwed:number; breakdown:TaxBracket[]; effectiveRate:number}>
  generateDoc: (docType:string) => Promise<TaxDocument>
}
export const useTaxStore = create<State>()(
  persist(
    (set) => ({
      taxYear:null, documents:[], summary:null, effectiveRate:0, isLoading:false,
      fetchTax: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/tax')
          const d = data.data
          set({ taxYear:d.taxYear, documents:d.documents??[], summary:d.summary, effectiveRate:d.effectiveRate??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      computeTax: async (grossIncome, deductions, year) => {
        const { data } = await api.post('/tax/compute', { grossIncome, deductions, year })
        const d = data.data
        set(s => ({ taxYear:s.taxYear?{...s.taxYear, taxOwed:d.taxOwed, taxableIncome:d.taxableIncome, breakdown:d.breakdown}:null, effectiveRate:d.effectiveRate }))
        return d
      },
      generateDoc: async (docType) => {
        const { data } = await api.post('/tax/documents', { docType })
        const doc = data.data
        set(s => ({ documents:[doc,...(s.documents??[])] }))
        return doc
      },
    }),
    { name:'opay-tax-v10', onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.documents))s.documents=[] } }
  )
)
