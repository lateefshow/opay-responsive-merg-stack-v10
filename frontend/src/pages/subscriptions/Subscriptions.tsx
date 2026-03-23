import { useState, useEffect } from 'react'
import { Calendar, Pause, Play, Trash2, Plus, TrendingDown, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useSubscriptionStore } from '@/store/useSubscriptionStore'
import { formatCurrency, formatDate, cn, sleep } from '@/lib/utils'
import type { Subscription } from '@/types'
import toast from 'react-hot-toast'

const CAT_COLORS: Record<string, string> = {
  Entertainment:'bg-red-50 text-red-600',
  Productivity: 'bg-blue-50 text-blue-600',
  Storage:      'bg-gray-100 text-gray-600',
  Professional: 'bg-indigo-50 text-indigo-600',
  Design:       'bg-purple-50 text-purple-600',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label:'Active',    color:'text-brand-700', bg:'bg-brand-50' },
  paused:    { label:'Paused',    color:'text-amber-700', bg:'bg-amber-50' },
  cancelled: { label:'Cancelled', color:'text-gray-500',  bg:'bg-gray-100' },
  trial:     { label:'Trial',     color:'text-blue-700',  bg:'bg-blue-50'  },
}

function SubCard({ sub, onToggle, onCancel }: {
  sub: Subscription; onToggle: () => void; onCancel: () => void
}) {
  const meta = STATUS_META[sub.status] ?? STATUS_META.active
  const catStyle = CAT_COLORS[sub.category] ?? 'bg-gray-50 text-gray-600'
  const daysUntil = Math.ceil((new Date(sub.nextBillingDate).getTime() - Date.now()) / 86400000)
  const isUrgent = daysUntil <= 3 && sub.status === 'active'

  return (
    <div className={cn('bg-white rounded-3xl shadow-card overflow-hidden transition-all', sub.status === 'cancelled' && 'opacity-60')}>
      <div className="h-1 w-full" style={{ background: sub.color }}/>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: `${sub.color}15` }}>
              {sub.logo}
            </div>
            <div>
              <p className="font-bold text-gray-900">{sub.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn('badge text-[9px]', catStyle)}>{sub.category}</span>
                <span className={cn('badge text-[9px]', meta.bg, meta.color)}>{meta.label}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display font-bold text-gray-900">{formatCurrency(sub.amount, 'NGN', true)}</p>
            <p className="text-xs text-gray-400 capitalize">/{sub.frequency === 'monthly' ? 'mo' : sub.frequency === 'quarterly' ? 'qtr' : 'yr'}</p>
          </div>
        </div>

        {/* Billing info */}
        <div className={cn('flex items-center gap-2 text-xs mb-3 px-3 py-2 rounded-xl',
          isUrgent ? 'bg-red-50' : 'bg-gray-50')}>
          <Calendar size={12} className={isUrgent ? 'text-red-500' : 'text-gray-400'}/>
          <span className={isUrgent ? 'text-red-600 font-bold' : 'text-gray-500'}>
            {sub.status === 'cancelled' ? `Cancelled` :
             sub.status === 'paused' ? 'Billing paused' :
             daysUntil <= 0 ? 'Due today' :
             daysUntil === 1 ? 'Due tomorrow' :
             `Next billing in ${daysUntil} days`}
          </span>
          {isUrgent && <AlertTriangle size={11} className="text-red-500 ml-auto"/>}
        </div>

        {/* Trial badge */}
        {sub.status === 'trial' && sub.trialEndsAt && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 mb-3">
            <p className="text-xs font-bold text-blue-700">
              Free trial ends {formatDate(sub.trialEndsAt, 'relative')} · Will auto-charge {formatCurrency(sub.amount)} after
            </p>
          </div>
        )}

        {/* Card */}
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
          <CreditCard size={12}/>
          <span>Charged to card ending ••{sub.cardLast4}</span>
        </div>

        {/* Actions */}
        {sub.status !== 'cancelled' && (
          <div className="flex gap-2">
            <button onClick={onToggle}
              className={cn('flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all active:scale-95',
                sub.status === 'paused' ? 'bg-brand-50 text-brand-700 hover:bg-brand-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100')}>
              {sub.status === 'paused' ? <><Play size={12}/>Resume</> : <><Pause size={12}/>Pause</>}
            </button>
            <button onClick={onCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all active:scale-95">
              <Trash2 size={12}/>Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SubscriptionManager() {
  const { subscriptions, fetchSubscriptions, addSubscription, togglePause, cancelSubscription, totalMonthly } = useSubscriptionStore()
  const [showAdd, setShowAdd]     = useState(false)
  const [filter, setFilter]       = useState<'all'|'active'|'paused'|'cancelled'>('all')

  useEffect(() => { fetchSubscriptions() }, [])
  const safeSubs = subscriptions ?? []
  const monthly  = totalMonthly()
  const annual   = monthly * 12

  const filtered = filter === 'all' ? safeSubs : safeSubs.filter(s => s.status === filter)
  const dueSoon  = safeSubs.filter(s => {
    const d = Math.ceil((new Date(s.nextBillingDate).getTime() - Date.now()) / 86400000)
    return d <= 7 && s.status === 'active'
  })

  const handleToggle = async (id: string, name: string, status: string) => {
    await togglePause(id)
    toast.success(status === 'active' ? `${name} paused` : `${name} resumed`)
  }

  const handleCancel = async (id: string, name: string) => {
    await cancelSubscription(id)
    toast.success(`${name} subscription cancelled`)
  }

  const byCategory = safeSubs
    .filter(s => s.status === 'active' || s.status === 'trial')
    .reduce((acc, s) => { acc[s.category] = (acc[s.category] ?? 0) + s.amount; return acc }, {} as Record<string, number>)

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Subscriptions</h1><p className="page-subtitle">Manage all your digital subs</p></div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15}/> Track
        </button>
      </div>

      {/* Summary hero */}
      <div className="mx-4 mb-4 bg-analytics-gradient rounded-3xl p-5 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-1">Monthly Spend</p>
          <p className="font-display font-bold text-white text-3xl mb-1">{formatCurrency(monthly)}</p>
          <p className="text-indigo-200 text-xs mb-4">That's {formatCurrency(annual)} per year</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              {label:'Active',   val:safeSubs.filter(s=>s.status==='active').length    },
              {label:'Paused',   val:safeSubs.filter(s=>s.status==='paused').length    },
              {label:'Trials',   val:safeSubs.filter(s=>s.status==='trial').length     },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/10 rounded-2xl p-2.5 text-center">
                <p className="text-white/50 text-[9px] font-semibold">{label}</p>
                <p className="text-white font-display font-bold text-lg">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Due soon alert */}
      {dueSoon.length > 0 && (
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-amber-600"/>
            <p className="text-sm font-bold text-gray-900">Billing soon ({dueSoon.length})</p>
          </div>
          {dueSoon.map(s => {
            const d = Math.ceil((new Date(s.nextBillingDate).getTime() - Date.now()) / 86400000)
            return (
              <div key={s.id} className="flex justify-between items-center py-1.5 text-xs">
                <span className="flex items-center gap-2"><span>{s.logo}</span><span className="font-bold text-gray-900">{s.name}</span></span>
                <span className="text-amber-700 font-bold">{d <= 0 ? 'Today' : `${d}d`} · {formatCurrency(s.amount, 'NGN', true)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Spend by category */}
      {Object.keys(byCategory).length > 0 && (
        <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
          <p className="font-display font-bold text-sm text-gray-900 mb-3">Spend by Category</p>
          <div className="space-y-2">
            {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([cat, amt]) => {
              const pct = Math.round((amt / monthly) * 100)
              return (
                <div key={cat}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className={cn('font-bold px-2 py-0.5 rounded-full', CAT_COLORS[cat]??'bg-gray-50 text-gray-600')}>{cat}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(amt, 'NGN', true)}/mo · {pct}%</span>
                  </div>
                  <div className="progress-bar h-1.5">
                    <div style={{width:`${pct}%`,height:'100%',borderRadius:'9999px',background:'#4f46e5',transition:'width 1s ease'}}/>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">Could save by cancelling paused</span>
            <span className="font-bold text-brand-600">{formatCurrency(safeSubs.filter(s=>s.status==='paused').reduce((s,sub)=>s+sub.amount,0), 'NGN', true)}/mo</span>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['all','active','paused','cancelled'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('tab-pill flex-1 capitalize text-[11px]', filter===f?'tab-active':'tab-inactive')}>{f}</button>
        ))}
      </div>

      {/* Subscription list */}
      <div className="px-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <CreditCard size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="font-bold text-gray-500">No {filter === 'all' ? '' : filter} subscriptions</p>
          </div>
        ) : (
          filtered.map(sub => (
            <SubCard key={sub.id} sub={sub}
              onToggle={() => handleToggle(sub.id, sub.name, sub.status)}
              onCancel={() => handleCancel(sub.id, sub.name)}/>
          ))
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Subscriptions" showBack/>
      <DeviceFrame>{content}</DeviceFrame>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Track Subscription">
        <div className="text-center py-6">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-gray-300"/>
          <p className="text-sm text-gray-500">Subscription detection automatically tracks payments from your transaction history.</p>
          <p className="text-xs text-gray-400 mt-2">Manual tracking form coming in next update.</p>
          <button onClick={() => setShowAdd(false)} className="btn-primary mt-5 px-6 py-2.5 text-sm">Got it</button>
        </div>
      </Modal>
    </>
  )
}
