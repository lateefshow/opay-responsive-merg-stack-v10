import { useState, useEffect } from 'react'
import { Gift, Copy, Eye, EyeOff, Plus, CheckCircle2, ShoppingBag, Clock, Tag } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useGiftCardStore, BRANDS } from '@/store/useGiftCardStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn, sleep } from '@/lib/utils'
import type { GiftCard } from '@/types'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:  { label:'Active',  color:'text-brand-700', bg:'bg-brand-50' },
  used:    { label:'Used',    color:'text-gray-500',  bg:'bg-gray-100' },
  expired: { label:'Expired', color:'text-red-600',   bg:'bg-red-50'   },
}

function GiftCardItem({ card }: { card: GiftCard }) {
  const [revealed, setRevealed] = useState(false)
  const meta = STATUS_META[card.status] ?? STATUS_META.active
  const usedPct = Math.round(((card.amount - card.balance) / card.amount) * 100)

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: card.color }}/>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${card.color}18` }}>
              {card.logo}
            </div>
            <div>
              <p className="font-bold text-gray-900">{card.brand}</p>
              <p className="text-xs text-gray-400 mt-0.5">Face value: {formatCurrency(card.amount)}</p>
            </div>
          </div>
          <span className={cn('badge text-[10px]', meta.bg, meta.color)}>{meta.label}</span>
        </div>

        {/* Balance */}
        <div className="bg-gray-50 rounded-2xl p-3 mb-3">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-gray-400">Remaining Balance</span>
            <span className="font-display font-bold text-gray-900">{formatCurrency(card.balance)}</span>
          </div>
          <div className="progress-bar">
            <div style={{
              height:'100%', borderRadius:'9999px',
              width:`${100 - usedPct}%`,
              background: card.color,
              transition: 'width 1s ease',
            }}/>
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>{100 - usedPct}% remaining</span>
            <span>Used: {formatCurrency(card.amount - card.balance, 'NGN', true)}</span>
          </div>
        </div>

        {/* Code and PIN */}
        {card.status === 'active' && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">Gift Card Code</p>
                <p className="font-mono text-sm font-bold text-gray-900 tracking-widest">
                  {revealed ? card.code : card.code.replace(/[A-Z0-9]/g, '•')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard.writeText(card.code); toast.success('Code copied!') }}
                  className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors">
                  <Copy size={13} className="text-gray-600"/>
                </button>
                <button onClick={() => setRevealed(v => !v)}
                  className="p-1.5 rounded-lg bg-white shadow-sm hover:bg-gray-100 transition-colors">
                  {revealed ? <EyeOff size={13} className="text-gray-600"/> : <Eye size={13} className="text-gray-600"/>}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">PIN</p>
                <p className="font-mono text-sm font-bold text-gray-900 tracking-[0.4em]">
                  {revealed ? card.pin : '••••'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expiry */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={11}/>
          <span>{card.status === 'expired' ? 'Expired' : 'Expires'}: {formatDate(card.expiryDate, 'short')}</span>
          <span>·</span>
          <span>Purchased {formatDate(card.purchasedAt, 'relative')}</span>
        </div>
      </div>
    </div>
  )
}

export default function GiftCards() {
  const { owned, fetchCards, purchaseCard, useCard } = useGiftCardStore()
  const { balance, setBalance } = useWalletStore()
  useEffect(() => { fetchCards() }, [])
  const [showBuy, setShowBuy]         = useState(false)
  const [selectedBrand, setSelected] = useState<typeof BRANDS[0] | null>(null)
  const [selectedAmt, setSelectedAmt] = useState(0)
  const [loading, setLoading]         = useState(false)
  const [success, setSuccess]         = useState<GiftCard | null>(null)
  const [tab, setTab]                 = useState<'owned' | 'buy'>('owned')

  const safeOwned = owned ?? []
  const activeCards   = safeOwned.filter(c => c.status === 'active')
  const inactiveCards = safeOwned.filter(c => c.status !== 'active')
  const totalBalance  = activeCards.reduce((s, c) => s + c.balance, 0)

  const handleBuy = async () => {
    if (!selectedBrand || !selectedAmt) return
    if (selectedAmt > balance) { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      const card = await purchaseCard(selectedBrand.name, selectedBrand.logo, selectedBrand.color, selectedAmt)
      setBalance(balance - selectedAmt)
      setSuccess(card)
      setShowBuy(false); setSelected(null); setSelectedAmt(0)
      toast.success(`${selectedBrand.name} gift card purchased!`)
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Purchase failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Gift Cards</h1><p className="page-subtitle">Buy, send & redeem</p></div>
        <button onClick={() => { setTab('buy'); setShowBuy(true) }}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> Buy
        </button>
      </div>

      {/* Summary */}
      <div className="mx-4 mb-4 bg-brand-gradient rounded-3xl p-5 relative overflow-hidden shadow-float-green">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Gift size={16} className="text-brand-200"/><span className="text-brand-100 text-xs font-semibold">Total Gift Card Balance</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalBalance)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{label:'Active', val:activeCards.length},{label:'Used', val:safeOwned.filter(c=>c.status==='used').length},{label:'Total Bought', val:safeOwned.length}].map(({label,val})=>(
              <div key={label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px] font-semibold">{label}</p>
                <p className="text-white font-display font-bold text-lg">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['owned','buy'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('tab-pill flex-1 capitalize', tab===t?'tab-active':'tab-inactive')}>
            {t === 'owned' ? `My Cards (${safeOwned.length})` : 'Browse & Buy'}
          </button>
        ))}
      </div>

      {tab === 'owned' && (
        <div className="px-4 space-y-3">
          {safeOwned.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Gift size={40} className="mx-auto mb-3 text-gray-200"/>
              <p className="font-bold text-gray-500">No gift cards yet</p>
              <button onClick={() => setShowBuy(true)} className="btn-primary mt-4 px-6 py-2.5 text-sm">Buy First Card</button>
            </div>
          ) : (
            <>
              {activeCards.length > 0 && <p className="section-label">Active ({activeCards.length})</p>}
              {activeCards.map(c => <GiftCardItem key={c.id} card={c}/>)}
              {inactiveCards.length > 0 && <p className="section-label mt-3">Past Cards ({inactiveCards.length})</p>}
              {inactiveCards.map(c => <GiftCardItem key={c.id} card={c}/>)}
            </>
          )}
        </div>
      )}

      {tab === 'buy' && (
        <div className="px-4">
          <p className="section-label">Available Brands</p>
          <div className="grid grid-cols-2 gap-3">
            {BRANDS.map(brand => (
              <button key={brand.id} onClick={() => { setSelected(brand); setShowBuy(true) }}
                className="bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-95">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3"
                  style={{ background: `${brand.color}18` }}>
                  {brand.logo}
                </div>
                <p className="font-bold text-sm text-gray-900">{brand.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{brand.category}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {brand.denominations.slice(0, 3).map(d => (
                    <span key={d} className="badge badge-gray text-[9px]">{formatCurrency(d, 'NGN', true)}</span>
                  ))}
                  {brand.denominations.length > 3 && (
                    <span className="badge badge-gray text-[9px]">+{brand.denominations.length - 3}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Gift Cards" showBack/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Buy modal */}
      <Modal isOpen={showBuy} onClose={() => { setShowBuy(false); setSelected(null); setSelectedAmt(0) }}
        title={selectedBrand ? `Buy ${selectedBrand.name}` : 'Choose Brand'}>
        {!selectedBrand ? (
          <div className="grid grid-cols-2 gap-3">
            {BRANDS.map(b => (
              <button key={b.id} onClick={() => setSelected(b)}
                className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-all active:scale-95">
                <span className="text-3xl">{b.logo}</span>
                <p className="text-xs font-bold text-gray-900">{b.name}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Brand header */}
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: `${selectedBrand.color}15` }}>
              <span className="text-3xl">{selectedBrand.logo}</span>
              <div>
                <p className="font-bold text-gray-900">{selectedBrand.name}</p>
                <p className="text-xs text-gray-500">{selectedBrand.category} · Digital delivery</p>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Wallet Balance</span>
              <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Select Amount</p>
              <div className="grid grid-cols-2 gap-2">
                {selectedBrand.denominations.map(d => (
                  <button key={d} onClick={() => setSelectedAmt(d)}
                    className={cn('py-3 text-sm font-bold rounded-2xl border-2 transition-all',
                      selectedAmt === d ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300')}>
                    {formatCurrency(d)}
                  </button>
                ))}
              </div>
              {selectedAmt > balance && <p className="text-red-500 text-xs mt-2">Insufficient balance</p>}
            </div>

            <button onClick={handleBuy} disabled={!selectedAmt || selectedAmt > balance || loading}
              className="btn-primary w-full py-3.5">
              {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Purchasing…</div>
                : `Buy for ${selectedAmt ? formatCurrency(selectedAmt) : '—'}`}
            </button>
          </div>
        )}
      </Modal>

      {/* Success modal */}
      <Modal isOpen={!!success} onClose={() => setSuccess(null)}>
        {success && (
          <div className="flex flex-col items-center text-center py-4">
            <span className="text-5xl mb-4">{success.logo}</span>
            <h2 className="font-display font-bold text-xl mb-1">{success.brand} Gift Card! 🎉</h2>
            <p className="text-gray-500 text-sm mb-5">Your card is ready to use</p>
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-3 mb-5">
              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 mb-1">Card Code</p>
                <p className="font-mono font-bold text-gray-900 text-lg tracking-widest">{success.code}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-400 mb-1">PIN</p>
                <p className="font-mono font-bold text-gray-900 tracking-[0.5em]">{success.pin}</p>
              </div>
              <button onClick={() => { navigator.clipboard.writeText(`Code: ${success.code} | PIN: ${success.pin}`); toast.success('Copied!') }}
                className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50">
                <Copy size={14}/> Copy Code & PIN
              </button>
            </div>
            <button onClick={() => setSuccess(null)} className="btn-primary w-full py-3.5">Done</button>
          </div>
        )}
      </Modal>
    </>
  )
}
