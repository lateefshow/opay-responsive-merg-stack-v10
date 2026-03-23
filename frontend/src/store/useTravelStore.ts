import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/axios'

export interface TravelBooking { id:string; type:string; title:string; provider:string; from:string; to:string; departDate:string; returnDate?:string; passengers:number; amount:number; reference:string; status:string; seatInfo:string; createdAt:string }
export interface FlightOption { airline:string; logo:string; class:string; fare:number; duration:string; departure:string; arrival:string }
interface State {
  bookings: TravelBooking[]; totalSpent: number; isLoading: boolean
  flightResults: FlightOption[]
  fetchBookings: () => Promise<void>
  searchFlights: (from:string, to:string, passengers:number) => Promise<FlightOption[]>
  bookFlight: (p:{from:string;to:string;departDate:string;passengers:number;classType:string}) => Promise<TravelBooking>
  bookHotel: (p:{city:string;hotel:string;checkIn:string;checkOut:string;rooms:number}) => Promise<TravelBooking>
}
export const useTravelStore = create<State>()(
  persist(
    (set) => ({
      bookings:[], totalSpent:0, isLoading:false, flightResults:[],
      fetchBookings: async () => {
        set({ isLoading:true })
        try {
          const { data } = await api.get('/travel')
          set({ bookings:data.data.bookings??[], totalSpent:data.data.totalSpent??0 })
        } catch {} finally { set({ isLoading:false }) }
      },
      searchFlights: async (from, to, passengers) => {
        const { data } = await api.get(`/travel/flights?from=${from}&to=${to}&passengers=${passengers}`)
        const flights: FlightOption[] = data.data.flights ?? []
        set({ flightResults:flights })
        return flights
      },
      bookFlight: async (payload) => {
        const { data } = await api.post('/travel/flights/book', payload)
        const booking: TravelBooking = data.data.booking
        set(s => ({ bookings:[booking,...(s.bookings??[])], totalSpent:(s.totalSpent??0)+booking.amount }))
        return booking
      },
      bookHotel: async (payload) => {
        const { data } = await api.post('/travel/hotels/book', payload)
        const booking: TravelBooking = data.data.booking
        set(s => ({ bookings:[booking,...(s.bookings??[])], totalSpent:(s.totalSpent??0)+booking.amount }))
        return booking
      },
    }),
    { name:'opay-travel-v10', onRehydrateStorage:()=>(s)=>{ if(s){if(!Array.isArray(s.bookings))s.bookings=[];if(!Array.isArray(s.flightResults))s.flightResults=[]} } }
  )
)
