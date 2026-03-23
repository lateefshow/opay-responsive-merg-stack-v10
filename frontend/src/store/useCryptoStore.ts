import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface CryptoHolding { symbol:string; name:string; quantity:number; price:number; ngnValue:number; color:string }
export interface CryptoTx { id:string; type:string; symbol:string; amount:number; ngnValue:number; price:number; fee:number; reference:string; createdAt:string }
export interface CryptoCoin { symbol:string; name:string; color:string; price:number }
interface State {
  holdings: CryptoHolding[]; totalNGN: number; transactions: CryptoTx[]
  coins: CryptoCoin[]; prices: Record<string,number>; isLoading: boolean
  fetchWallet: () => Promise<void>
  buyCrypto: (symbol:string, ngnAmount:number) => Promise<void>
  sellCrypto: (symbol:string, quantity:number) => Promise<void>
  convertCrypto: (fromSymbol:string, toSymbol:string, quantity:number) => Promise<void>
}
export const useCryptoStore = create<State>()(
  persist(
    (set) => ({
      holdings:[], totalNGN:0, transactions:[], coins:[], prices:{}, isLoading:false,
      fetchWallet: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/crypto/wallet')
          const d = data.data
          set({ holdings:d.holdings??[], totalNGN:d.totalNGN??0, transactions:d.transactions??[], coins:d.coins??[], prices:d.prices??{} })
        } catch {} finally { set({ isLoading:false }) }
      },
      buyCrypto: async (symbol, ngnAmount) => {
        await api.post('/crypto/buy', { symbol, amount:ngnAmount })
      },
      sellCrypto: async (symbol, quantity) => {
        await api.post('/crypto/sell', { symbol, quantity })
      },
      convertCrypto: async (fromSymbol, toSymbol, quantity) => {
        await api.post('/crypto/convert', { fromSymbol, toSymbol, quantity })
      },
    }),
    { name:'opay-crypto-v10', onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.holdings))s.holdings=[];if(!Array.isArray(s.transactions))s.transactions=[];if(!Array.isArray(s.coins))s.coins=[]} } }
  )
)
