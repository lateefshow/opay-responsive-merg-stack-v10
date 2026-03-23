import { useState, useEffect } from 'react'
import { ShoppingBag, CheckCircle2, Clock, AlertTriangle, Plus, CreditCard, ChevronRight, Calendar } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useBNPLStore } from '@/store/useBNPLStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { BNPLPlan } from '@/types'
import toast from 'react-hot-toast'

const BNPL_MERCHANTS = [
  { id: 'jumia',    name: 'Jumia',     logo: '🛒', color: '#f97316', category: 'Shopping',   maxLimit: 200000, installments: [3, 6, 12], interest: 0 },
  { id: 'konga',    name: 'Konga',     logo: '🛍️', color: '#dc2626', category: 'Shopping',   maxLimit: 150000, installments: [3, 6],     interest: 0 },
  { id: 'paystack', name: 'Paystack',  logo: '💳', color: '#0ea5e9', category: 'Business',   maxLimit: 500000, installments: [3, 6, 12], interest: 0 },
  { id: 'flutterwave', name: 'Flutterwave', logo: '🦋', color: '#f59e0b', category: 'Business', maxLimit: 500000, installments: [3, 6, 12], interest: 0 },
  { id: 'slot',     name: 'SLOT Nigeria', logo: '📱', color: '#7c3aed', category: 'Electronics', maxLimit: 300000, installments: [3, 6], interest: 0 },
  { id: 'car',      name: 'CarFirst',  logo: '🚗', color: '#16a34a', category: 'Transport',  maxLimit: 2000000, installments: [6, 12, 24], interest: 5 },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:    { label: 'Active',    color: 'text-blue-700',  bg: 'bg-blue-50',  icon: Clock },
  completed: { label: 'Completed', color: 'text-brand-700', bg: 'bg-brand-50', icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   color: 'text-red-700',   bg: 'bg-red-50',   icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'text-gray-500',  bg: 'bg-gray-100', icon: AlertTriangle },
}

function PlanCard({ plan, onPay }: { plan: BNPLPlan; onPay: (plan: BNPLPlan) => void }) {
  const meta = STATUS_META[plan.status] ?? STATUS_META.active
  const Icon = meta.icon
  const paid     = (plan.installments ?? []).filter(i => i.paid).length
  const total    = (plan.installments ?? []).length
  const nextDue  = (plan.installments ?? []).find(i => !i.paid)
  const paidPct  = total > 0 ? Math.round((paid / total) * 100) : 0

  return (
    <div className="bg-white rounded-3xl shadow-card overflow-hidden">
      <div className="h-1.5 w-full" style={{ background: plan.status === 'completed' ? '#16a34a' : plan.status === 'overdue' ? '#ef4444' : '#3b82f6' }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
              {plan.merchantLogo}
            </div>
            <div>
              <p className="font-bold text-gray-900">{plan.merchant}</p>
              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{plan.description}</p>
            </div>
          </div>
          <span className={cn('badge text-[10px] flex items-center gap-1', meta.bg, meta.color)}>
            <Icon size={10} />{meta.label}
          </span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400">Paid</span>
            <span className="font-display font-bold text-gray-900">{formatCurrency(plan.amountPaid)} <span className="text-gray-400 font-normal text-xs">/ {formatCurrency(plan.totalAmount)}</span></span>
          </div>
          <div className="progress-bar mb-1">
            <div className="progress-fill" style={{ '--progress': `${paidPct}%` } as React.CSSProperties} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{paid}/{total} installments</span>
            <span>{paidPct}% paid</span>
          </div>
        </div>

        {nextDue && plan.status === 'active' && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar size={12} />
              <span>Next: {formatCurrency(nextDue.amount)} due {formatDate(nextDue.dueDate, 'short')}</span>
            </div>
            <button onClick={() => onPay(plan)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 px-3 py-1.5 rounded-xl hover:bg-brand-700 transition-colors active:scale-95">
              Pay Now
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Started {formatDate(plan.createdAt, 'relative')}</span>
          <span className="capitalize">{plan.frequency} payments</span>
        </div>
      </div>
    </div>
  )
}

export default function PayLater() {
  const { plans, totalOutstanding, isLoading, fetchPlans, createPlan, payInstallment } = useBNPLStore()
  const { balance, setBalance } = useWalletStore()
  const [showNew, setShowNew]     = useState(false)
  const [showPay, setShowPay]     = useState<BNPLPlan | null>(null)
  const [selMerchant, setSelMerchant] = useState<typeof BNPL_MERCHANTS[0] | null>(null)
  const [amount, setAmount]       = useState('')
  const [numInstall, setNumInstall] = useState(3)
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly')
  const [desc, setDesc]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<'active' | 'all'>('active')

  useEffect(() => { fetchPlans() }, [])

  const safePlans   = plans ?? []
  const activePlans = safePlans.filter(p => p.status === 'active' || p.status === 'overdue')
  const allPlans    = safePlans
  const displayPlans = tab === 'active' ? activePlans : allPlans

  const perInstall = selMerchant && amount ? Math.round(Number(amount) / numInstall * 100) / 100 : 0

  const handleCreate = async () => {
    if (!selMerchant || !amount || !desc) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      await createPlan({
        merchant: selMerchant.name, merchantLogo: selMerchant.logo,
        description: desc, totalAmount: Number(amount),
        installments: numInstall, frequency,
      })
      toast.success(`${selMerchant.name} BNPL plan created!`)
      setShowNew(false); setSelMerchant(null); setAmount(''); setDesc('')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed to create plan')
    } finally { setLoading(false) }
  }

  const handlePay = async (plan: BNPLPlan) => {
    const nextDue = (plan.installments ?? []).find(i => !i.paid)
    if (!nextDue) return
    if (balance < nextDue.amount) { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      const updated = await payInstallment(plan.id, nextDue.number)
      setBalance(balance - nextDue.amount)
      toast.success(`Installment ${nextDue.number} paid! ✅`)
      setShowPay(updated)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Payment failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Pay Later</h1><p className="page-subtitle">Buy now, pay in installments</p></div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 shadow-float-green active:scale-95 transition-all">
          <Plus size={15} /> New
        </button>
      </div>

      {/* Summary hero */}
      <div className="mx-4 mb-4 rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-5 shadow-premium relative">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1"><CreditCard size={14} className="text-blue-200" /><span className="text-blue-100 text-xs font-semibold">Total Outstanding</span></div>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalOutstanding)}</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Active', val: activePlans.length },
              { label: 'Completed', val: safePlans.filter(p => p.status === 'completed').length },
              { label: 'Total Plans', val: safePlans.length },
            ].map(({ label, val }) => (
              <div key={label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                <p className="text-white/60 text-[9px]">{label}</p>
                <p className="text-white font-display font-bold text-lg">{val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="mx-4 mb-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-xs font-bold text-blue-900 mb-2">How Pay Later works</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['🛍️', 'Shop now'], ['📅', 'Split into 3-12'], ['✅', '0% interest']].map(([emoji, label]) => (
            <div key={label}>
              <p className="text-lg mb-0.5">{emoji}</p>
              <p className="text-[10px] font-bold text-blue-700">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {([['active', `Active (${activePlans.length})`], ['all', `All Plans (${safePlans.length})`]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn('tab-pill flex-1', tab === id ? 'tab-active' : 'tab-inactive')}>{label}</button>
        ))}
      </div>

      <div className="px-4 space-y-3">
        {displayPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-500">No plans yet</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Shop now, pay in easy installments</p>
            <button onClick={() => setShowNew(true)} className="btn-primary px-6 py-2.5 text-sm">Start Shopping</button>
          </div>
        ) : (
          displayPlans.map(plan => (
            <PlanCard key={plan.id} plan={plan} onPay={(p) => {
              setShowPay(p)
              handlePay(p)
            }} />
          ))
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Pay Later" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Create modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); setSelMerchant(null); setAmount(''); setDesc('') }} title="New BNPL Plan">
        {!selMerchant ? (
          <div>
            <p className="text-sm text-gray-500 mb-3">Choose a merchant</p>
            <div className="grid grid-cols-2 gap-3">
              {BNPL_MERCHANTS.map(m => (
                <button key={m.id} onClick={() => setSelMerchant(m)}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-brand-50 transition-all active:scale-95">
                  <span className="text-3xl">{m.logo}</span>
                  <p className="text-xs font-bold text-gray-900">{m.name}</p>
                  <p className="text-[10px] text-gray-400">Up to {formatCurrency(m.maxLimit, 'NGN', true)}</p>
                  {m.interest > 0 && <span className="badge badge-gold text-[9px]">{m.interest}% interest</span>}
                  {m.interest === 0 && <span className="badge badge-green text-[9px]">0% interest</span>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: `${selMerchant.color}15` }}>
              <span className="text-3xl">{selMerchant.logo}</span>
              <div><p className="font-bold text-gray-900">{selMerchant.name}</p><p className="text-xs text-gray-500">{selMerchant.category} · {selMerchant.interest === 0 ? '0% interest' : `${selMerchant.interest}% p.a.`}</p></div>
            </div>
            <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
              <span className="text-gray-600">Wallet Balance</span>
              <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Purchase Amount (₦)</label>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
                placeholder={`Max ${formatCurrency(selMerchant.maxLimit, 'NGN', true)}`}
                className="input-field text-xl font-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Description</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What are you buying?" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Installments</label>
              <div className="flex gap-2">
                {selMerchant.installments.map(n => (
                  <button key={n} type="button" onClick={() => setNumInstall(n)}
                    className={cn('flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all',
                      numInstall === n ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300')}>
                    {n}x
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Frequency</label>
              <div className="flex gap-2">
                {(['weekly', 'biweekly', 'monthly'] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFrequency(f)}
                    className={cn('flex-1 py-2.5 text-xs font-bold rounded-xl border-2 capitalize transition-all',
                      frequency === f ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600')}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {perInstall > 0 && (
              <div className="bg-gray-50 rounded-2xl px-4 py-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Per installment</span><span className="font-bold">{formatCurrency(perInstall)}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-600">Total</span><span className="font-bold text-brand-600">{formatCurrency(Number(amount))}</span></div>
              </div>
            )}
            <button onClick={handleCreate} disabled={loading || !amount || !desc} className="btn-primary w-full py-4">
              {loading ? 'Creating…' : 'Create Plan'}
            </button>
          </div>
        )}
      </Modal>
    </>
  )
}
