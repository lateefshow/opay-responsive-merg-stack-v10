import { useState, useEffect } from 'react'
import { Plane, Hotel, MapPin, Calendar, Users, CheckCircle2, Clock, Plus, Search, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useTravelStore, type FlightOption } from '@/store/useTravelStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const AIRPORTS = [
  { code: 'LOS', name: 'Lagos — Murtala Muhammed', city: 'Lagos' },
  { code: 'ABV', name: 'Abuja — Nnamdi Azikiwe', city: 'Abuja' },
  { code: 'KAN', name: 'Kano — Mallam Aminu Kano', city: 'Kano' },
  { code: 'PHC', name: 'Port Harcourt', city: 'Port Harcourt' },
  { code: 'ENO', name: 'Enugu — Akanu Ibiam', city: 'Enugu' },
]

const HOTELS = [
  { name: 'Eko Hotel & Suites',     city: 'Lagos',         stars: 5, ratePerNight: 85000, image: '🏨' },
  { name: 'Transcorp Hilton',       city: 'Abuja',         stars: 5, ratePerNight: 95000, image: '🏩' },
  { name: 'Federal Palace Hotel',   city: 'Lagos',         stars: 5, ratePerNight: 75000, image: '🏨' },
  { name: 'Ibis Styles Abuja',      city: 'Abuja',         stars: 3, ratePerNight: 35000, image: '🏨' },
  { name: 'Golden Tulip Port Harcourt', city: 'Port Harcourt', stars: 4, ratePerNight: 45000, image: '🏩' },
  { name: 'Hamdala Hotel',          city: 'Kano',          stars: 3, ratePerNight: 20000, image: '🏨' },
]

const STATUS_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  active:  { icon: CheckCircle2, color: 'text-brand-600',  bg: 'bg-brand-50', label: 'Confirmed' },
  used:    { icon: CheckCircle2, color: 'text-gray-500',   bg: 'bg-gray-100', label: 'Used'      },
  pending: { icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50', label: 'Pending'   },
  expired: { icon: Clock,        color: 'text-red-500',    bg: 'bg-red-50',   label: 'Expired'   },
}

export default function Travel() {
  const { bookings, totalSpent, isLoading, flightResults, fetchBookings, searchFlights, bookFlight, bookHotel } = useTravelStore()
  const { balance, setBalance } = useWalletStore()
  const [tab, setTab]       = useState<'book' | 'trips'>('book')
  const [mode, setMode]     = useState<'flight' | 'hotel'>('flight')
  const [loading, setLoading] = useState(false)

  // Flight search
  const [from, setFrom]     = useState('LOS')
  const [to, setTo]         = useState('ABV')
  const [depart, setDepart] = useState('')
  const [pax, setPax]       = useState(1)
  const [classType, setClassType] = useState('economy')
  const [searched, setSearched] = useState(false)
  const [showFlight, setShowFlight] = useState<FlightOption | null>(null)

  // Hotel search
  const [hotelCity, setHotelCity] = useState('Lagos')
  const [selHotel, setSelHotel]   = useState<typeof HOTELS[0] | null>(null)
  const [checkIn, setCheckIn]     = useState('')
  const [checkOut, setCheckOut]   = useState('')
  const [rooms, setRooms]         = useState(1)
  const [showHotelBook, setShowHotelBook] = useState(false)

  useEffect(() => { fetchBookings() }, [])

  const safeBookings = bookings ?? []
  const cityHotels   = HOTELS.filter(h => h.city === hotelCity)

  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 1
  const hotelTotal = selHotel ? selHotel.ratePerNight * nights * rooms : 0

  const handleSearchFlights = async () => {
    if (!from || !to || from === to) { toast.error('Choose different airports'); return }
    setLoading(true)
    try {
      await searchFlights(from, to, pax)
      setSearched(true)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  const handleBookFlight = async (flight: FlightOption) => {
    if (!depart) { toast.error('Select a departure date'); return }
    if (flight.fare > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await bookFlight({ from, to, departDate: depart, passengers: pax, classType })
      setBalance(balance - flight.fare)
      toast.success(`✈️ Flight to ${to} booked! Check My Trips`)
      setSearched(false); setShowFlight(null); setTab('trips')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Booking failed')
    } finally { setLoading(false) }
  }

  const handleBookHotel = async () => {
    if (!selHotel || !checkIn || !checkOut) { toast.error('Fill all fields'); return }
    if (hotelTotal > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      await bookHotel({ city: selHotel.city, hotel: selHotel.name, checkIn, checkOut, rooms })
      setBalance(balance - hotelTotal)
      toast.success(`🏨 ${selHotel.name} booked!`)
      setShowHotelBook(false); setTab('trips')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Booking failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Travel & Lifestyle</h1><p className="page-subtitle">Book flights, hotels and more</p></div>
        <button onClick={() => fetchBookings()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Hero */}
      <div className="mx-4 mb-4 rounded-4xl bg-gradient-to-br from-sky-500 to-blue-700 p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-semibold mb-1">Travel Spent (all time)</p>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalSpent, 'NGN', true)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{ l: 'Total Trips', v: safeBookings.length },
              { l: 'Flights',    v: safeBookings.filter(b => b.type === 'flight').length },
              { l: 'Hotels',     v: safeBookings.filter(b => b.type === 'hotel').length }].map(({ l, v }) => (
              <div key={l} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px]">{l}</p>
                <p className="text-white font-display font-bold text-lg">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['book', 'trips'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'trips' ? `My Trips (${safeBookings.length})` : 'Book Travel'}
          </button>
        ))}
      </div>

      {tab === 'book' && (
        <div className="px-4">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-4">
            {([['flight', '✈️ Flights'], ['hotel', '🏨 Hotels']] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setSearched(false) }}
                className={cn('flex-1 py-2.5 text-sm font-bold rounded-2xl transition-all', mode === m ? 'bg-brand-600 text-white shadow-float-green' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'flight' && (
            <div className="space-y-3">
              {!searched ? (
                <>
                  <div className="bg-white rounded-3xl shadow-card p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">From</label>
                      <select value={from} onChange={e => setFrom(e.target.value)} className="input-field">
                        {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">To</label>
                      <select value={to} onChange={e => setTo(e.target.value)} className="input-field">
                        {AIRPORTS.filter(a => a.code !== from).map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Departure</label>
                        <input type="date" value={depart} onChange={e => setDepart(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Passengers</label>
                        <select value={pax} onChange={e => setPax(Number(e.target.value))} className="input-field">
                          {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} passenger{n>1?'s':''}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">Class</label>
                      <div className="flex gap-2">
                        {(['economy', 'business', 'first'] as const).map(c => (
                          <button key={c} onClick={() => setClassType(c)} className={cn('flex-1 py-2 text-xs font-bold rounded-xl capitalize border-2 transition-all', classType===c?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600')}>{c}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSearchFlights} disabled={loading || from === to} className="w-full flex items-center justify-center gap-2 btn-primary py-4">
                    <Search size={16} /> {loading ? 'Searching…' : 'Search Flights'}
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-gray-900">{from} → {to} · {pax} pax</p>
                    <button onClick={() => setSearched(false)} className="text-xs text-brand-600 font-bold">Change</button>
                  </div>
                  <div className="space-y-3">
                    {(flightResults ?? []).map((f, i) => (
                      <div key={i} className="bg-white rounded-3xl shadow-card p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-gray-900">{f.airline}</p>
                            <p className="text-xs text-gray-400 capitalize">{f.class} · {f.duration}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-display font-bold text-gray-900">{formatCurrency(f.fare, 'NGN', true)}</p>
                            <p className="text-xs text-gray-400">per {pax > 1 ? `${pax} pax` : 'person'}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-3">
                          <div className="text-center"><p className="font-bold text-gray-900">{f.departure}</p><p className="text-xs text-gray-400">{from}</p></div>
                          <div className="flex-1 flex items-center justify-center gap-2 px-3">
                            <div className="h-px flex-1 bg-gray-200" />
                            <Plane size={12} className="text-brand-500" />
                            <div className="h-px flex-1 bg-gray-200" />
                          </div>
                          <div className="text-center"><p className="font-bold text-gray-900">{f.arrival}</p><p className="text-xs text-gray-400">{to}</p></div>
                        </div>
                        <button onClick={() => setShowFlight(f)} disabled={!depart}
                          className={cn('w-full py-2.5 text-sm font-bold rounded-2xl transition-all', !depart ? 'bg-gray-100 text-gray-400' : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-95')}>
                          {!depart ? 'Select departure date first' : `Book · ${formatCurrency(f.fare, 'NGN', true)}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {mode === 'hotel' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">City</label>
                <div className="flex gap-2 flex-wrap">
                  {['Lagos', 'Abuja', 'Kano', 'Port Harcourt'].map(c => (
                    <button key={c} onClick={() => setHotelCity(c)} className={cn('px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all', hotelCity===c?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600')}>{c}</button>
                  ))}
                </div>
              </div>
              {cityHotels.map(hotel => (
                <div key={hotel.name} className="bg-white rounded-3xl shadow-card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{hotel.image}</span>
                      <div>
                        <p className="font-bold text-gray-900">{hotel.name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={10} />{hotel.city} · {'⭐'.repeat(hotel.stars)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-display font-bold text-gray-900">{formatCurrency(hotel.ratePerNight, 'NGN', true)}</p>
                      <p className="text-xs text-gray-400">/night</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelHotel(hotel); setShowHotelBook(true) }}
                    className="w-full py-2.5 text-sm font-bold bg-brand-50 text-brand-700 rounded-2xl hover:bg-brand-100 transition-all active:scale-95">
                    Book Room
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'trips' && (
        <div className="px-4">
          {safeBookings.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Plane size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No trips booked yet</p>
              <button onClick={() => setTab('book')} className="btn-primary mt-4 px-6 py-2.5 text-sm">Book Now</button>
            </div>
          ) : (
            <div className="space-y-3">
              {safeBookings.map(b => {
                const meta = STATUS_META[b.status] ?? STATUS_META.active
                const Icon = meta.icon
                return (
                  <div key={b.id} className="bg-white rounded-3xl shadow-card overflow-hidden">
                    <div className="h-1 w-full" style={{ background: b.type === 'flight' ? '#0ea5e9' : '#8b5cf6' }} />
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', b.type === 'flight' ? 'bg-sky-50' : 'bg-purple-50')}>
                            {b.type === 'flight' ? <Plane size={18} className="text-sky-600" /> : <Hotel size={18} className="text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{b.title}</p>
                            <p className="text-xs text-gray-400">{b.provider}</p>
                          </div>
                        </div>
                        <span className={cn('badge text-[10px]', meta.bg, meta.color)}>{meta.label}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-gray-400">Date</p>
                          <p className="font-bold text-gray-900">{formatDate(b.departDate, 'short')}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-gray-400">{b.type === 'flight' ? 'Seat' : 'Room'}</p>
                          <p className="font-bold text-gray-900">{b.seatInfo}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400">Ref: {b.reference}</p>
                        <p className="font-display font-bold text-gray-900">{formatCurrency(b.amount, 'NGN', true)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Travel" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Flight booking confirmation */}
      <Modal isOpen={!!showFlight} onClose={() => setShowFlight(null)} title="Confirm Flight Booking">
        {showFlight && (
          <div className="space-y-4">
            <div className="bg-sky-50 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <p className="font-bold text-gray-900">{showFlight.airline}</p>
                <span className="badge badge-green text-[9px] capitalize">{showFlight.class}</span>
              </div>
              {[['Route', `${from} → ${to}`], ['Date', depart ? formatDate(depart) : '—'], ['Passengers', `${pax}`], ['Duration', showFlight.duration], ['Departure', showFlight.departure], ['Arrival', showFlight.arrival]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1"><span className="text-gray-500">{k}</span><span className="font-bold text-gray-900">{v}</span></div>
              ))}
            </div>
            <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
              <span className="font-bold">Total</span>
              <span className="font-bold text-brand-600">{formatCurrency(showFlight.fare)}</span>
            </div>
            {showFlight.fare > balance && <p className="text-red-500 text-xs">Insufficient balance</p>}
            <button onClick={() => handleBookFlight(showFlight)} disabled={loading || showFlight.fare > balance} className="btn-primary w-full py-4">
              {loading ? 'Booking…' : `Confirm & Pay ${formatCurrency(showFlight.fare)}`}
            </button>
          </div>
        )}
      </Modal>

      {/* Hotel booking modal */}
      <Modal isOpen={showHotelBook} onClose={() => setShowHotelBook(false)} title={`Book ${selHotel?.name ?? ''}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Check-in</label>
              <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} min={new Date().toISOString().split('T')[0]} className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Check-out</label>
              <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} min={checkIn || new Date().toISOString().split('T')[0]} className="input-field text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Rooms: {rooms}</label>
            <input type="range" min={1} max={5} value={rooms} onChange={e => setRooms(Number(e.target.value))} className="w-full accent-brand-600" />
          </div>
          {checkIn && checkOut && (
            <div className="bg-gray-50 rounded-2xl p-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{nights} night{nights > 1 ? 's' : ''} × {rooms} room{rooms > 1 ? 's' : ''}</span><span className="font-bold">{formatCurrency(selHotel?.ratePerNight ?? 0, 'NGN', true)}/night</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="font-bold">Total</span><span className="font-bold text-brand-600">{formatCurrency(hotelTotal)}</span></div>
            </div>
          )}
          {hotelTotal > balance && <p className="text-red-500 text-xs">Insufficient balance</p>}
          <button onClick={handleBookHotel} disabled={loading || !checkIn || !checkOut || hotelTotal > balance} className="btn-primary w-full py-4">
            {loading ? 'Booking…' : `Book · ${formatCurrency(hotelTotal)}`}
          </button>
        </div>
      </Modal>
    </>
  )
}
