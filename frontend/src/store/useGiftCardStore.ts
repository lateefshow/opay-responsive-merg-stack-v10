import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'
import type { GiftCard, GiftCardBrand } from '@/types'

export const BRANDS: GiftCardBrand[] = [
  { id:'jumia',   name:'Jumia',      logo:'🛒', color:'#f97316', denominations:[1000,2000,5000,10000,20000], category:'Shopping'     },
  { id:'netflix', name:'Netflix',    logo:'🎬', color:'#ef4444', denominations:[2000,4000,8000,15000],       category:'Entertainment' },
  { id:'spotify', name:'Spotify',    logo:'🎵', color:'#22c55e', denominations:[1500,3000,5000],             category:'Entertainment' },
  { id:'uber',    name:'Uber',       logo:'🚗', color:'#111827', denominations:[1000,2500,5000,10000],       category:'Transport'     },
  { id:'konga',   name:'Konga',      logo:'🛍️', color:'#dc2626', denominations:[2000,5000,10000,25000],      category:'Shopping'      },
  { id:'steam',   name:'Steam',      logo:'🎮', color:'#1e40af', denominations:[5000,10000,20000,50000],     category:'Gaming'        },
  { id:'amazon',  name:'Amazon',     logo:'📦', color:'#f59e0b', denominations:[5000,10000,20000],           category:'Shopping'      },
  { id:'itunes',  name:'Apple Store',logo:'🍎', color:'#6b7280', denominations:[2500,5000,10000,25000],      category:'Digital'       },
]

interface State {
  owned:  GiftCard[]
  brands: GiftCardBrand[]
  isLoading: boolean
  fetchCards:   () => Promise<void>
  purchaseCard: (brand:string, logo:string, color:string, amount:number) => Promise<GiftCard>
  useCard:      (id:string, amount:number) => Promise<void>
}

export const useGiftCardStore = create<State>()(
  persist(
    (set, get) => ({
      owned:[], brands:BRANDS, isLoading:false,
      fetchCards: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/gift-cards')
          set({ owned: data.data.cards ?? [] })
        } catch {} finally { set({ isLoading:false }) }
      },
      purchaseCard: async (brand, logo, color, amount) => {
        const { data } = await api.post('/gift-cards', { brand, logo, color, amount })
        const card: GiftCard = data.data.card
        set(s => ({ owned:[card, ...(s.owned??[])] }))
        return card
      },
      useCard: async (id, amount) => {
        const { data } = await api.post(`/gift-cards/${id}/use`, { amount })
        const updated: GiftCard = data.data.card
        set(s => ({ owned:(s.owned??[]).map(c => c.id===id ? updated : c) }))
      },
    }),
    {
      name:'opay-giftcards-v10',
      onRehydrateStorage:()=>(s)=>{ if(s&&!Array.isArray(s.owned))s.owned=[] },
    }
  )
)
