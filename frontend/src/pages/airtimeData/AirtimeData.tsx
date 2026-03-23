import { useState, useEffect } from 'react'
import { Smartphone, Wifi, CheckCircle2, RefreshCw, Clock } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import { useAirtimeStore } from '@/store/useAirtimeStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const NETWORKS = [
  { id: 'MTN',     color: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700', logo: '🟡' },
  { id: 'Airtel',  color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700',   logo: '🔴' },
  { id: 'Glo',     color: '#16a34a', bg: 'bg-green-50',  text: 'text-brand-700', logo: '🟢' },
  { id: '9mobile', color: '#22c55e', bg: 'bg-green-50',  text: 'text-green-700', logo: '🟩' },
]

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000]

export default function AirtimeData() {
  const { history, totalSpent, dataPlans, isLoading, fetchHistory, fetchDataPlans, buyAirtime } = useAirtimeStore()
  const { balance, setBalance } = useWalletStore()

  const [tab, setTab]           = useState<'buy' | 'history'>('buy')
  const [mode, setMode]         = useState<'airtime' | 'data'>('airtime')
  const [network, setNetwork]   = useState('MTN')
  const [phone, setPhone]       = useState('')
  const [amount, setAmount]     = useState('')
  const [selPlan, setSelPlan]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState<{ ref: string; amount: number; network: string } | null>(null)

  useEffect(() => { fetchHistory() }, [])

  useEffect(() => {
    if (mode === 'data') fetchDataPlans(network)
  }, [mode, network])

  const safeHistory = history ?? []
  const safePlans   = dataPlans ?? []

  const selectedPlan = safePlans.find(p => p.id === selPlan)
  const buyAmount    = mode === 'airtime' ? Number(amount) || 0 : selectedPlan?.amount || 0

  const handleBuy = async () => {
    if (!phone || phone.length < 10) { toast.error('Enter a valid phone number'); return }
    if (mode === 'airtime' && !amount) { toast.error('Enter amount'); return }
    if (mode === 'data' && !selPlan) { toast.error('Select a data plan'); return }
    if (buyAmount > balance) { toast.error('Insufficient wallet balance'); return }
    setLoading(true)
    try {
      const purchase = await buyAirtime(network, phone, buyAmount, mode, mode === 'data' ? selPlan : undefined)
      setBalance(balance - purchase.amount)
      setSuccess({ ref: purchase.reference, amount: purchase.amount, network })
      setAmount(''); setSelPlan('')
      toast.success(`${mode === 'airtime' ? 'Airtime' : 'Data'} sent to ${phone}!`)
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Purchase failed')
    } finally { setLoading(false) }
  }

  const net = NETWORKS.find(n => n.id === network) ?? NETWORKS[0]

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Airtime & Data</h1><p className="page-subtitle">Buy for yourself or others</p></div>
        <button onClick={() => fetchHistory()} className="btn-icon bg-gray-100">
          <RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-4 mb-4">
        {[
          { label: 'Total Spent', value: formatCurrency(totalSpent, 'NGN', true), sub: 'all time' },
          { label: 'Purchases',   value: safeHistory.length,                      sub: 'total' },
          { label: 'This Month',  value: formatCurrency(safeHistory.filter(h => new Date(h.createdAt) > new Date(Date.now() - 2592000000)).reduce((s, h) => s + h.amount, 0), 'NGN', true), sub: '30 days' },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-white rounded-3xl shadow-card p-3 text-center">
            <p className="text-[10px] font-bold text-gray-400">{label}</p>
            <p className="font-display font-bold text-gray-900 text-base mt-0.5">{value}</p>
            <p className="text-[10px] text-gray-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['buy', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1 capitalize', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'history' ? `History (${safeHistory.length})` : 'Buy Now'}
          </button>
        ))}
      </div>

      {tab === 'buy' && (
        <div className="px-4 space-y-4">
          {/* Success banner */}
          {success && (
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-brand-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-brand-900">Purchase Successful!</p>
                <p className="text-xs text-brand-700">Ref: {success.ref} · {formatCurrency(success.amount)}</p>
              </div>
              <button onClick={() => setSuccess(null)} className="ml-auto text-brand-500 text-xs font-bold">Dismiss</button>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2">
            {([['airtime', '📞 Airtime'], ['data', '📶 Data']] as const).map(([m, label]) => (
              <button key={m} onClick={() => setMode(m)}
                className={cn('flex-1 py-3 text-sm font-bold rounded-2xl transition-all', mode === m ? 'bg-brand-600 text-white shadow-float-green' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                {label}
              </button>
            ))}
          </div>

          {/* Network selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Network</label>
            <div className="grid grid-cols-4 gap-2">
              {NETWORKS.map(n => (
                <button key={n.id} onClick={() => setNetwork(n.id)}
                  className={cn('flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all',
                    network === n.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                  <span className="text-xl">{n.logo}</span>
                  <span className="text-[10px] font-bold text-gray-700">{n.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Phone number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} type="tel"
              placeholder="e.g. 08012345678" maxLength={14} className="input-field text-lg font-bold" />
          </div>

          {/* Airtime: amount */}
          {mode === 'airtime' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₦)</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {QUICK_AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(String(a))}
                    className={cn('py-3 text-sm font-bold rounded-2xl border-2 transition-all',
                      Number(amount) === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300')}>
                    ₦{a.toLocaleString()}
                  </button>
                ))}
              </div>
              <input value={amount} onChange={e => setAmount(e.target.value)} type="number"
                placeholder="Or enter custom amount" className="input-field" />
            </div>
          )}

          {/* Data: plan selector */}
          {mode === 'data' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Select Data Plan</label>
              {safePlans.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading plans…</p>
              ) : (
                <div className="space-y-2">
                  {safePlans.map(plan => (
                    <button key={plan.id} onClick={() => setSelPlan(plan.id)}
                      className={cn('w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition-all',
                        selPlan === plan.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                      <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Wifi size={14} className="text-brand-500" />{plan.label}
                      </span>
                      <span className="font-display font-bold text-brand-600">{formatCurrency(plan.amount, 'NGN', true)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wallet balance */}
          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Wallet Balance</span>
            <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>

          {buyAmount > balance && buyAmount > 0 && <p className="text-red-500 text-xs">Insufficient balance</p>}

          <button onClick={handleBuy} disabled={loading || !phone || buyAmount <= 0 || buyAmount > balance}
            className="btn-primary w-full py-4">
            {loading ? 'Processing…' : `${mode === 'airtime' ? 'Send Airtime' : 'Buy Data'} · ${buyAmount ? formatCurrency(buyAmount) : '—'}`}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4">
          {safeHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Smartphone size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No purchases yet</p>
            </div>
          ) : (
            <div className="surface">
              {safeHistory.map((h, idx) => {
                const n = NETWORKS.find(x => x.id === h.network) ?? NETWORKS[0]
                return (
                  <div key={h.id} className={cn('list-item', idx < safeHistory.length - 1 && 'border-b border-gray-50')}>
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0', n.bg)}>{n.logo}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{h.network} · {h.planType === 'data' ? 'Data' : 'Airtime'}</p>
                      <p className="text-xs text-gray-400">{h.phone} · {formatDate(h.createdAt, 'relative')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">-{formatCurrency(h.amount, 'NGN', true)}</p>
                      <div className="flex items-center gap-1 justify-end">
                        <CheckCircle2 size={10} className="text-brand-500" />
                        <span className="text-[10px] text-brand-600 font-bold">Success</span>
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
      <AppHeader title="Airtime & Data" showBack />
      <DeviceFrame>{content}</DeviceFrame>
    </>
  )
}
