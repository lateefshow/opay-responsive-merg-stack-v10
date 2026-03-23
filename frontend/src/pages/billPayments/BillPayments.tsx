import { useState, useEffect } from 'react'
import { Zap, Tv, Wifi, Droplets, Target, CheckCircle2, Copy, RefreshCw } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useBillPaymentStore } from '@/store/useBillPaymentStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id: 'electricity', label: 'Electricity', icon: Zap,     color: '#f59e0b', bg: 'bg-amber-50',  text: 'text-amber-700'  },
  { id: 'cable_tv',    label: 'Cable TV',     icon: Tv,      color: '#3b82f6', bg: 'bg-blue-50',   text: 'text-blue-700'   },
  { id: 'internet',    label: 'Internet',     icon: Wifi,    color: '#8b5cf6', bg: 'bg-purple-50', text: 'text-purple-700' },
  { id: 'water',       label: 'Water',        icon: Droplets,color: '#0ea5e9', bg: 'bg-sky-50',    text: 'text-sky-700'    },
  { id: 'betting',     label: 'Betting',      icon: Target,  color: '#ef4444', bg: 'bg-red-50',    text: 'text-red-700'    },
]

// Built-in providers as fallback
const FALLBACK_PROVIDERS: Record<string, Array<{ id: string; name: string; logo: string }>> = {
  electricity: [{ id:'ekedc', name:'EKEDC (Eko)', logo:'⚡'}, { id:'ikedc', name:'IKEDC (Ikeja)', logo:'⚡'}, { id:'aedc', name:'AEDC (Abuja)', logo:'⚡'}, { id:'phedc', name:'PHEDC', logo:'⚡'}],
  cable_tv:    [{ id:'dstv', name:'DStv', logo:'📺'}, { id:'gotv', name:'GOtv', logo:'📺'}, { id:'startimes', name:'StarTimes', logo:'📺'}],
  internet:    [{ id:'spectranet', name:'Spectranet', logo:'🌐'}, { id:'smile', name:'Smile 4G', logo:'🌐'}, { id:'swift', name:'Swift', logo:'🌐'}],
  water:       [{ id:'lswc', name:'Lagos State Water', logo:'💧'}, { id:'abuja_water', name:'Abuja FCDA Water', logo:'💧'}],
  betting:     [{ id:'bet9ja', name:'Bet9ja', logo:'🎯'}, { id:'sportybet', name:'SportyBet', logo:'🎯'}, { id:'1xbet', name:'1xBet', logo:'🎯'}],
}

const QUICK_AMOUNTS: Record<string, number[]> = {
  electricity: [1000, 2000, 5000, 10000, 20000, 50000],
  cable_tv:    [4200, 7900, 9500, 12400, 15700, 21000],
  internet:    [3500, 7500, 15000, 25000, 50000, 100000],
  water:       [1000, 2000, 5000, 10000],
  betting:     [500, 1000, 2000, 5000, 10000],
}

export default function BillPayments() {
  const { history, totalSpent, isLoading, payBill } = useBillPaymentStore()
  const { balance, setBalance } = useWalletStore()

  const [tab, setTab]         = useState<'pay' | 'history'>('pay')
  const [selCat, setSelCat]   = useState('electricity')
  const [providers, setProviders] = useState<Array<{ id: string; name: string; logo: string }>>(FALLBACK_PROVIDERS.electricity)
  const [selProvider, setSelProvider] = useState('')
  const [accountNum, setAccountNum]   = useState('')
  const [amount, setAmount]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [receipt, setReceipt]         = useState<{ token?: string; ref: string; amount: number; provider: string } | null>(null)

  const safeHistory = history ?? []

  useEffect(() => {
    // Load providers from API
    api.get(`/bill-providers?category=${selCat}`)
      .then(({ data }) => {
        const p = data.data?.providers
        if (Array.isArray(p) && p.length > 0) setProviders(p)
        else setProviders(FALLBACK_PROVIDERS[selCat] ?? [])
      })
      .catch(() => setProviders(FALLBACK_PROVIDERS[selCat] ?? []))
    setSelProvider('')
    setAmount('')
  }, [selCat])

  const numAmt = Number(amount) || 0
  const cat = CATEGORIES.find(c => c.id === selCat) ?? CATEGORIES[0]

  const handlePay = async () => {
    if (!selProvider) { toast.error('Select a provider'); return }
    if (!accountNum)  { toast.error('Enter account/smartcard number'); return }
    if (!numAmt)      { toast.error('Enter amount'); return }
    if (numAmt > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    try {
      const payment = await payBill(selCat, selProvider, accountNum, numAmt)
      setBalance(balance - payment.amount)
      const provName = providers.find(p => p.id === selProvider)?.name ?? selProvider
      setReceipt({ token: (payment as any).token, ref: payment.reference, amount: payment.amount, provider: provName })
      setAccountNum(''); setAmount('')
      toast.success('Bill paid successfully! ✅')
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Payment failed')
    } finally { setLoading(false) }
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Bill Payments</h1><p className="page-subtitle">Pay all your bills in one place</p></div>
        <button onClick={() => {}} className="btn-icon bg-gray-100"><RefreshCw size={16} className={cn('text-gray-600', isLoading && 'animate-spin')} /></button>
      </div>

      {/* Summary */}
      <div className="mx-4 mb-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-5 shadow-premium relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10" />
        <div className="relative z-10">
          <p className="text-white/70 text-xs font-semibold mb-1">Total Bills Paid</p>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalSpent, 'NGN', true)}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/15 rounded-2xl p-2.5 text-center"><p className="text-white/60 text-[9px]">Payments</p><p className="text-white font-display font-bold text-lg">{safeHistory.length}</p></div>
            <div className="bg-white/15 rounded-2xl p-2.5 text-center"><p className="text-white/60 text-[9px]">Wallet Balance</p><p className="text-white font-display font-bold text-lg">{formatCurrency(balance, 'NGN', true)}</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 px-4 mb-4">
        {(['pay', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('tab-pill flex-1', tab === t ? 'tab-active' : 'tab-inactive')}>
            {t === 'history' ? `History (${safeHistory.length})` : 'Pay Bills'}
          </button>
        ))}
      </div>

      {tab === 'pay' && (
        <div className="px-4 space-y-4">
          {/* Category selector */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                return (
                  <button key={c.id} onClick={() => setSelCat(c.id)}
                    className={cn('flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all',
                      selCat === c.id ? `border-[${c.color}] ${c.bg}` : 'border-gray-200 hover:border-gray-300',
                      selCat === c.id && 'border-brand-400 bg-brand-50')}>
                    <Icon size={18} className={selCat === c.id ? 'text-brand-600' : 'text-gray-400'} />
                    <span className="text-[9px] font-bold text-gray-600">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Provider */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Provider</label>
            <div className="space-y-2">
              {providers.map(p => (
                <button key={p.id} onClick={() => setSelProvider(p.id)}
                  className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left',
                    selProvider === p.id ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
                  <span className="text-lg">{p.logo}</span>
                  <span className="text-sm font-bold text-gray-900">{p.name}</span>
                  {selProvider === p.id && <CheckCircle2 size={16} className="text-brand-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Account number */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">
              {selCat === 'electricity' ? 'Meter Number' : selCat === 'cable_tv' ? 'Smartcard/IUC Number' : 'Account Number'}
            </label>
            <input value={accountNum} onChange={e => setAccountNum(e.target.value)}
              placeholder={selCat === 'electricity' ? 'e.g. 1234567890' : 'Enter account number'}
              className="input-field font-mono" />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Amount (₦)</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(QUICK_AMOUNTS[selCat] ?? QUICK_AMOUNTS.electricity).map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={cn('py-2.5 text-sm font-bold rounded-2xl border-2 transition-all',
                    numAmt === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-700 hover:border-gray-300')}>
                  {formatCurrency(a, 'NGN', true)}
                </button>
              ))}
            </div>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="Or enter custom amount" className="input-field" />
          </div>

          <div className="bg-brand-50 rounded-xl px-4 py-3 flex justify-between text-sm">
            <span className="text-gray-600">Wallet Balance</span>
            <span className="font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>
          {numAmt > balance && numAmt > 0 && <p className="text-red-500 text-xs">Insufficient balance</p>}

          <button onClick={handlePay} disabled={loading || !selProvider || !accountNum || !numAmt || numAmt > balance}
            className="btn-primary w-full py-4">
            {loading ? 'Processing…' : `Pay ${numAmt ? formatCurrency(numAmt) : '—'}`}
          </button>
        </div>
      )}

      {tab === 'history' && (
        <div className="px-4">
          {safeHistory.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl shadow-card">
              <Zap size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-500">No bills paid yet</p>
            </div>
          ) : (
            <div className="surface">
              {safeHistory.map((h, idx) => {
                const c = CATEGORIES.find(x => x.id === h.category) ?? CATEGORIES[0]
                const Icon = c.icon
                return (
                  <div key={h.id} className={cn('list-item', idx < safeHistory.length - 1 && 'border-b border-gray-50')}>
                    <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', c.bg)}>
                      <Icon size={16} className={c.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{h.provider}</p>
                      <p className="text-xs text-gray-400">{h.accountNum} · {formatDate(h.createdAt, 'relative')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">-{formatCurrency(h.amount, 'NGN', true)}</p>
                      <span className="badge badge-green text-[9px]">Paid</span>
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
      <AppHeader title="Bill Payments" showBack />
      <DeviceFrame>{content}</DeviceFrame>

      {/* Receipt Modal */}
      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Payment Receipt">
        {receipt && (
          <div className="flex flex-col items-center text-center py-2">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-brand-600" />
            </div>
            <h2 className="font-display font-bold text-xl mb-1">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mb-4">{receipt.provider}</p>
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 mb-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">{formatCurrency(receipt.amount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-mono font-bold text-xs">{receipt.ref}</span></div>
              {receipt.token && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-[10px] font-bold text-gray-400 mb-1">ELECTRICITY TOKEN</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-gray-900 text-sm tracking-widest flex-1">{receipt.token}</p>
                    <button onClick={() => { navigator.clipboard.writeText(receipt.token ?? ''); toast.success('Token copied!') }}
                      className="p-1.5 bg-white rounded-lg shadow-sm"><Copy size={13} className="text-gray-600" /></button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setReceipt(null)} className="btn-primary w-full py-3.5">Done</button>
          </div>
        )}
      </Modal>
    </>
  )
}
