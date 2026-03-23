import { useState, useEffect } from 'react'
import { Globe, Star, StarOff, Plus, Send, Clock, CheckCircle2, AlertCircle, ChevronRight, Plane } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useRemittanceStore, REMITTANCE_RATES } from '@/store/useRemittanceStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatCurrencyForeign, formatDate, cn, sleep } from '@/lib/utils'
import type { RemittanceRecipient, RemittanceTransaction } from '@/types'
import toast from 'react-hot-toast'

const STATUS_META: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  pending:    { icon:Clock,         color:'text-amber-600',  bg:'bg-amber-50',  label:'Pending'    },
  processing: { icon:Clock,         color:'text-blue-600',   bg:'bg-blue-50',   label:'Processing' },
  delivered:  { icon:CheckCircle2,  color:'text-brand-600',  bg:'bg-brand-50',  label:'Delivered'  },
  failed:     { icon:AlertCircle,   color:'text-red-600',    bg:'bg-red-50',    label:'Failed'     },
  cancelled:  { icon:AlertCircle,   color:'text-gray-500',   bg:'bg-gray-100',  label:'Cancelled'  },
}

export default function Remittance() {
  const { recipients, transactions, fetchRecipients, fetchHistory, addRecipient, toggleFavorite, sendRemittance } = useRemittanceStore()
  const { balance, setBalance } = useWalletStore()
  const [showSend, setShowSend]           = useState(false)
  const [showAddRec, setShowAddRec]       = useState(false)
  const [selectedRec, setSelectedRec]    = useState<RemittanceRecipient | null>(null)
  const [amount, setAmount]              = useState('')
  const [loading, setLoading]            = useState(false)
  const [tab, setTab]                    = useState<'send'|'history'>('send')

  useEffect(() => { fetchRecipients(); fetchHistory() }, [])
  const safeRecipients    = recipients ?? []
  const safeTransactions  = transactions ?? []
  const favRecipients     = safeRecipients.filter(r => r.isFavorite)
  const numAmt            = Number(amount) || 0
  const rateInfo          = selectedRec ? REMITTANCE_RATES[selectedRec.currency] : null
  const receiveAmt        = rateInfo ? numAmt * rateInfo.rate : 0
  const fee               = rateInfo?.fee ?? 0
  const totalCost         = numAmt + fee

  const totalSent = safeTransactions
    .filter(t => t.status === 'delivered')
    .reduce((s, t) => s + t.sendAmount, 0)

  const handleSend = async () => {
    if (!selectedRec || !numAmt) return
    if (totalCost > balance) { toast.error('Insufficient balance (including ₦' + fee.toLocaleString() + ' fee)'); return }
    setLoading(true)
    try {
      await sendRemittance({ recipientId:selectedRec.id, sendAmount:numAmt, currency:selectedRec.currency })
      setBalance(balance - totalCost)
      toast.success(`Sending ${formatCurrency(numAmt)} to ${selectedRec.name}!`)
      setShowSend(false); setSelectedRec(null); setAmount('')
    } catch (err: unknown) {
      toast.error((err as {response?:{data?:{error?:string}}})?.response?.data?.error ?? 'Transfer failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Remittance</h1><p className="page-subtitle">Send money internationally</p></div>
      </div>

      {/* Stats */}
      <div className="mx-4 mb-4 bg-dark-gradient rounded-3xl p-5 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><Globe size={16} className="text-white/60"/><span className="text-white/60 text-xs font-semibold">Total Remitted</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalSent)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[{label:'Countries',val:new Set(safeTransactions.map(t=>t.country)).size},{label:'Transfers',val:safeTransactions.length},{label:'Recipients',val:safeRecipients.length}].map(({label,val})=>(
              <div key={label} className="bg-white/10 rounded-xl p-2.5 text-center">
                <p className="text-white/50 text-[9px]">{label}</p>
                <p className="text-white font-display font-bold text-lg">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live rates */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="font-display font-bold text-sm text-gray-900 mb-3">Live Rates (₦ per 1 unit)</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(REMITTANCE_RATES).map(([cur, info]) => (
            <div key={cur} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{info.flag}</span>
                <span className="text-xs font-bold text-gray-900">{cur}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">₦{(1/info.rate).toLocaleString('en-NG',{maximumFractionDigits:0})}</p>
                <p className="text-[9px] text-gray-400">{info.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['send','history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('tab-pill flex-1 capitalize', tab===t?'tab-active':'tab-inactive')}>
            {t === 'history' ? `History (${safeTransactions.length})` : 'Send Money'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="px-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label mb-0">Saved Recipients</p>
            <button onClick={() => setShowAddRec(true)}
              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700">
              <Plus size={13}/> Add New
            </button>
          </div>

          {favRecipients.length > 0 && (
            <div className="flex gap-3 mb-4 overflow-x-auto pb-1">
              {favRecipients.map(r => (
                <button key={r.id} onClick={() => { setSelectedRec(r); setShowSend(true) }}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all">
                  <div className="w-14 h-14 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-2xl">{r.flag}</div>
                  <span className="text-[10px] font-bold text-gray-600 max-w-[56px] truncate">{r.name.split(' ')[0]}</span>
                  <span className="text-[9px] text-gray-400">{r.currency}</span>
                </button>
              ))}
            </div>
          )}

          <div className="surface">
            {safeRecipients.map((r, idx) => (
              <div key={r.id} className={cn('list-item', idx < safeRecipients.length-1 && 'border-b border-gray-50')}>
                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">{r.flag}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.country} · {r.bank} · {r.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleFavorite(r.id)}>
                    {r.isFavorite ? <Star size={15} className="text-amber-400 fill-amber-400"/> : <StarOff size={15} className="text-gray-300"/>}
                  </button>
                  <button onClick={() => { setSelectedRec(r); setShowSend(true) }}
                    className="flex items-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-xl hover:bg-brand-100 transition-colors">
                    <Send size={11}/> Send
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4">
          {safeTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Plane size={40} className="mx-auto mb-3 text-gray-200"/>
              <p className="font-bold text-gray-500">No transfers yet</p>
            </div>
          ) : (
            <div className="surface">
              {safeTransactions.map(tx => {
                const meta = STATUS_META[tx.status] ?? STATUS_META.pending
                const Icon = meta.icon
                return (
                  <div key={tx.id} className="list-item">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">{tx.flag}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{tx.recipientName}</p>
                      <p className="text-xs text-gray-400">{tx.country} · {formatDate(tx.createdAt, 'relative')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">-{formatCurrency(tx.sendAmount, 'NGN', true)}</p>
                      <div className={cn('flex items-center gap-1 justify-end', meta.color)}>
                        <Icon size={10}/><span className="text-[10px] font-bold">{meta.label}</span>
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
      <AppHeader title="Remittance" showBack/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Send modal */}
      <Modal isOpen={showSend} onClose={() => { setShowSend(false); setSelectedRec(null); setAmount('') }}
        title={selectedRec ? `Send to ${selectedRec.name}` : 'Send Money'}>
        {selectedRec && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
              <span className="text-3xl">{selectedRec.flag}</span>
              <div>
                <p className="font-bold text-gray-900">{selectedRec.name}</p>
                <p className="text-xs text-gray-500">{selectedRec.bank} · {selectedRec.country}</p>
              </div>
            </div>

            <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Wallet Balance</span>
              <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-400 mb-1">You Send (NGN)</p>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
                    placeholder="0.00" className="text-2xl font-display font-bold text-gray-900 bg-transparent outline-none w-full"/>
                </div>
              </div>
              {numAmt > 0 && rateInfo && (
                <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-bold">₦{(1/rateInfo.rate).toLocaleString('en-NG',{maximumFractionDigits:0})} = 1 {selectedRec.currency}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-bold text-orange-500">+{formatCurrency(fee, 'NGN', true)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total deducted</span><span className="font-bold">{formatCurrency(totalCost)}</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-1.5">
                    <span className="font-bold">Recipient gets</span>
                    <span className="font-bold text-brand-600">{formatCurrencyForeign(receiveAmt, selectedRec.currency)} {selectedRec.currency}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400"><span>Delivery</span><span>{rateInfo.time}</span></div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[10000, 25000, 50000, 100000].map(a => (
                <button key={a} type="button" onClick={() => setAmount(String(a))}
                  className={cn('py-2.5 text-xs font-bold rounded-xl border-2 transition-all',
                    numAmt===a?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {formatCurrency(a, 'NGN', true)}
                </button>
              ))}
            </div>

            {totalCost > balance && numAmt > 0 && <p className="text-red-500 text-xs">Insufficient balance (need {formatCurrency(totalCost)})</p>}

            <button onClick={handleSend} disabled={!numAmt || totalCost > balance || loading} className="btn-primary w-full py-4">
              {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending…</div>
                : `Send ${numAmt ? formatCurrency(numAmt) : '—'}`}
            </button>
          </div>
        )}
      </Modal>

      {/* Add recipient modal */}
      <Modal isOpen={showAddRec} onClose={() => setShowAddRec(false)} title="Add Recipient">
        <div className="text-center py-6">
          <Globe size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="text-sm text-gray-500">Full recipient addition form coming in next update.</p>
          <p className="text-xs text-gray-400 mt-1">For now, use the pre-loaded recipients to test transfers.</p>
          <button onClick={() => setShowAddRec(false)} className="btn-primary mt-4 px-6 py-2.5 text-sm">Got it</button>
        </div>
      </Modal>
    </>
  )
}
