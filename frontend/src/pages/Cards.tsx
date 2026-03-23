import { useEffect, useState } from 'react'
import { HelpCircle, CheckSquare, Snowflake, Trash2, Eye, EyeOff, Copy, RefreshCw, Lock, Plus, CreditCard, Settings, TrendingUp } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import FeatureCards from '@/components/cards/FeatureCards'
import CardCreateSuccessModal from '@/components/modals/CardCreateSuccessModal'
import Modal from '@/components/modals/Modal'
import ProgressRing from '@/components/ui/ProgressRing'
import api from '@/lib/axios'
import { Skeleton } from '@/components/common/Skeleton'
import { cn, formatDate, formatCurrency, percentage } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CardPublic } from '@/types'

const CARD_THEMES = [
  { id:'green',    label:'OPay Green',    gradient:'from-brand-600 to-brand-800'         },
  { id:'dark',     label:'Midnight Black',gradient:'from-gray-800 to-gray-950'           },
  { id:'gold',     label:'Premium Gold',  gradient:'from-amber-500 to-amber-700'         },
  { id:'midnight', label:'Deep Ocean',    gradient:'from-blue-900 to-indigo-900'         },
  { id:'rose',     label:'Rose Gold',     gradient:'from-rose-400 to-rose-600'           },
]

function CardPreview({ card, visible, onToggle }: { card:CardPublic; visible:boolean; onToggle:()=>void }) {
  const theme = CARD_THEMES.find(t=>t.id===card.theme) ?? CARD_THEMES[0]
  const expiry = `${String(card.expiryMonth).padStart(2,'0')}/${String(card.expiryYear).slice(-2)}`
  const isFrozen = card.status==='frozen'
  const spendPct = card.spendLimit ? percentage(card.totalSpent??0, card.spendLimit) : 0

  return (
    <div className={cn('relative w-full rounded-3xl p-6 shadow-float-green overflow-hidden transition-all duration-500 animate-card-appear', isFrozen&&'grayscale opacity-70', `bg-gradient-to-br ${theme.gradient}`)}>
      <div className="absolute inset-0 bg-card-shine pointer-events-none"/>
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full border-[24px] border-white/10 pointer-events-none"/>
      <div className="absolute -right-2 top-14 w-32 h-32 rounded-full border-[16px] border-white/10 pointer-events-none"/>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <span className="text-white font-display font-bold text-xl tracking-tight">OPay</span>
          <div className="flex items-center gap-2">
            {isFrozen && <div className="flex items-center gap-1 bg-blue-500/30 text-blue-200 text-xs font-bold px-2 py-0.5 rounded-full"><Lock size={9}/>Frozen</div>}
            <button onClick={onToggle} className="text-white/70 hover:text-white transition-colors">
              {visible?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
        </div>

        {/* Chip */}
        <div className="w-8 h-6 bg-amber-300/80 rounded-md mb-4 flex items-center justify-center">
          <div className="w-5 h-3 border border-amber-600/50 rounded-sm"/>
        </div>

        <p className="font-mono text-white text-lg tracking-widest mb-5 opacity-90">
          {visible ? card.maskedNumber : '•••• •••• •••• '+card.maskedNumber.slice(-4)}
        </p>

        <div className="flex justify-between items-end">
          <div><p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5">Cardholder</p><p className="text-white font-bold">{card.cardHolder}</p></div>
          <div className="text-center"><p className="text-white/60 text-[10px] uppercase tracking-widest mb-0.5">Expires</p><p className="text-white font-bold">{expiry}</p></div>
          <div className="flex items-center">
            <span className="text-white font-display font-bold text-sm">
              <span className="bg-red-500 text-white rounded px-1 mr-0.5">V</span>erve
            </span>
          </div>
        </div>

        {card.spendLimit && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Spend limit</span>
              <span>{formatCurrency(card.totalSpent??0,'NGN',true)} / {formatCurrency(card.spendLimit,'NGN',true)}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{width:`${spendPct}%`}}/>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Cards() {
  const [activeTab,       setActiveTab]       = useState<'virtual'|'physical'>('virtual')
  const [cards,           setCards]           = useState<CardPublic[]>([])
  const [isLoading,       setIsLoading]       = useState(true)
  const [isCreating,      setIsCreating]      = useState(false)
  const [successCard,     setSuccessCard]     = useState<CardPublic|null>(null)
  const [termsAccepted,   setTermsAccepted]   = useState(false)
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [selectedCard,    setSelectedCard]    = useState<CardPublic|null>(null)
  const [showTheme,       setShowTheme]       = useState(false)
  const [selectedTheme,   setSelectedTheme]   = useState('green')

  const fetchCards = async () => {
    try { const {data}=await api.get('/cards/'); setCards(data.data.cards) }
    catch { toast.error('Failed to load cards') }
    finally { setIsLoading(false) }
  }
  useEffect(()=>{ fetchCards() },[])

  const handleGetCard = async () => {
    if (!termsAccepted) { toast.error('Please accept Terms & Conditions'); return }
    setIsCreating(true)
    try {
      const {data}=await api.post('/cards/',{type:'virtual'})
      const newCard:CardPublic={...data.data,theme:selectedTheme,spendLimit:200000,totalSpent:0}
      setCards(prev=>prev.find(c=>c.id===newCard.id)?prev:[newCard,...prev])
      setSuccessCard(newCard)
    } catch(err:unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error??'Failed to create card')
    } finally { setIsCreating(false) }
  }

  const handleFreeze  = (c:CardPublic) => { setCards(prev=>prev.map(x=>x.id===c.id?{...x,status:x.status==='active'?'frozen':'active'}:x)); toast.success(c.status==='active'?'Card frozen':'Card unfrozen') }
  const handleCopy    = (c:CardPublic) => { navigator.clipboard.writeText(c.maskedNumber.replace(/\s/g,'')); toast.success('Card number copied!') }

  const displayCard = selectedCard ?? (activeTab==='virtual'?cards.find(c=>c.type==='virtual'):cards.find(c=>c.type==='physical')) ?? null
  const expiry = displayCard?`${String(displayCard.expiryMonth).padStart(2,'0')}/${String(displayCard.expiryYear).slice(-2)}`:''
  const activeCards = cards.filter(c=>c.type===activeTab)

  const content = (
    <div className="page-container">
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="font-display font-bold text-xl text-gray-900">OPay Cards</h1>
        <button className="text-brand-600 font-bold text-sm hover:text-brand-700 flex items-center gap-1"><HelpCircle size={16}/> Q&A</button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 mb-5">
        {(['virtual','physical'] as const).map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)}
            className={cn('pb-3 px-2 mr-6 text-sm font-bold capitalize transition-colors border-b-2 -mb-px',
              activeTab===tab?'text-gray-900 border-gray-900':'text-gray-400 border-transparent hover:text-gray-600')}>
            {tab==='virtual'?'Virtual Cards':'Physical Cards'}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-5">
        {/* Card visual */}
        {isLoading ? <Skeleton className="w-full h-52 rounded-3xl"/> :
         displayCard ? <CardPreview card={displayCard} visible={showCardDetails} onToggle={()=>setShowCardDetails(v=>!v)}/> : (
          <div className={cn('w-full rounded-3xl p-6 relative overflow-hidden h-52 flex flex-col justify-between', `bg-gradient-to-br ${CARD_THEMES.find(t=>t.id===selectedTheme)?.gradient}`)}>
            <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full border-[22px] border-white/10"/>
            <span className="text-white font-display font-bold text-xl relative z-10">OPay</span>
            <div className="relative z-10">
              <p className="font-mono text-white/70 text-lg tracking-widest mb-2">•••• •••• •••• ••••</p>
              <p className="text-white/60 text-sm">Virtual Card · {CARD_THEMES.find(t=>t.id===selectedTheme)?.label}</p>
            </div>
          </div>
         )}

        {/* Card actions */}
        {displayCard && (
          <div className="grid grid-cols-4 gap-2">
            {[
              {icon:Eye,    label:showCardDetails?'Hide':'Show',   action:()=>setShowCardDetails(v=>!v)},
              {icon:Copy,   label:'Copy No.',                       action:()=>handleCopy(displayCard)  },
              {icon:Snowflake,label:displayCard.status==='frozen'?'Unfreeze':'Freeze', action:()=>handleFreeze(displayCard)},
              {icon:Trash2, label:'Cancel',                         action:()=>toast.error('Contact support')},
            ].map(({icon:Icon,label,action})=>(
              <button key={label} onClick={action}
                className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all active:scale-95">
                <Icon size={17} className="text-gray-600" strokeWidth={1.8}/>
                <span className="text-[10px] font-bold text-gray-600">{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Theme picker (before creating card) */}
        {!displayCard && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Choose Card Design</p>
            <div className="flex gap-2">
              {CARD_THEMES.map(t=>(
                <button key={t.id} onClick={()=>setSelectedTheme(t.id)}
                  className={cn('flex-1 h-10 rounded-xl bg-gradient-to-r transition-all border-2',
                    t.gradient, selectedTheme===t.id?'border-gray-800 scale-105':'border-transparent opacity-80')}>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card stats if has card */}
        {displayCard?.spendLimit && (
          <div className="grid grid-cols-3 gap-3">
            {[
              {label:'Spent',   value:formatCurrency(displayCard.totalSpent??0,'NGN',true), color:'text-gray-900'},
              {label:'Limit',   value:formatCurrency(displayCard.spendLimit,'NGN',true),    color:'text-gray-900'},
              {label:'Used',    value:`${percentage(displayCard.totalSpent??0,displayCard.spendLimit)}%`, color:'text-brand-600'},
            ].map(({label,value,color})=>(
              <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">{label}</p>
                <p className={cn('text-sm font-bold',color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <FeatureCards/>

        {/* Terms */}
        <button onClick={()=>setTermsAccepted(v=>!v)} className="flex items-start gap-3 w-full text-left">
          <div className={cn('w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border-2 transition-all',
            termsAccepted?'bg-brand-600 border-brand-600':'border-gray-300 bg-white')}>
            {termsAccepted&&<CheckSquare size={12} className="text-white"/>}
          </div>
          <p className="text-sm text-gray-600">Accept <a href="#" onClick={e=>e.stopPropagation()} className="text-brand-600 font-bold hover:underline">Terms & Conditions</a></p>
        </button>

        <button onClick={handleGetCard} disabled={isCreating||!termsAccepted} className="btn-primary w-full py-4 text-base">
          {isCreating
            ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating…</div>
            : activeCards.length>0?'Manage Card':'Get It Now'}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Cards"/>
      <DeviceFrame>{content}</DeviceFrame>
      <CardCreateSuccessModal isOpen={!!successCard} onClose={()=>setSuccessCard(null)} card={successCard}/>
    </>
  )
}
