import { useState } from 'react'
import { ArrowLeftRight, RefreshCw, CheckCircle2 } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useExchangeStore } from '@/store/useExchangeStore'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, formatCurrencyForeign, formatDate, CURRENCIES, sleep, cn } from '@/lib/utils'
import type { ExchangeTransaction } from '@/types'
import toast from 'react-hot-toast'

const LIVE_RATES: Record<string, { rate: number; change: number }> = {
  USD: { rate: 1580.00, change: +0.3 },
  GBP: { rate: 2028.50, change: -0.1 },
  EUR: { rate: 1720.25, change: +0.5 },
  GHS: { rate: 126.40,  change: +1.2 },
  KES: { rate: 12.18,   change: -0.4 },
  ZAR: { rate: 86.20,   change: +0.2 },
}

export default function Exchange() {
  const { transactions, addTransaction } = useExchangeStore()
  const { balance, setBalance } = useWalletStore()
  const [to, setTo]           = useState('USD')
  const [amount, setAmount]   = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<ExchangeTransaction|null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const numAmt  = Number(amount) || 0
  const rateInfo = LIVE_RATES[to]
  const rate    = rateInfo ? 1 / rateInfo.rate : 0
  const toAmt   = numAmt * rate
  const fee     = numAmt * 0.005

  const refreshRates = async () => { setRefreshing(true); await sleep(800); setRefreshing(false); toast.success('Rates updated!') }

  const onSubmit = async () => {
    if (!numAmt || numAmt <= 0) { toast.error('Enter an amount'); return }
    if (numAmt > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    await sleep(1500)
    const tx: ExchangeTransaction = {
      id: crypto.randomUUID(), userId:'', fromCurrency:'NGN', toCurrency:to,
      fromAmount:numAmt, toAmount:toAmt, rate, fee, status:'success', createdAt:new Date().toISOString(),
    }
    addTransaction(tx)
    setBalance(balance - numAmt - fee)
    setSuccess(tx)
    setAmount('')
    setLoading(false)
  }

  const content = (
    <div className="page-container">
      <div className="page-header">
        <div><h1 className="page-title">Currency Exchange</h1><p className="page-subtitle">Convert your naira instantly</p></div>
        <button onClick={refreshRates} className="btn-icon bg-gray-100 hover:bg-gray-200">
          <RefreshCw size={16} className={cn('text-gray-600', refreshing && 'animate-spin-slow')}/>
        </button>
      </div>

      {/* Live rates */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <p className="section-label mb-3">Live Exchange Rates</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(LIVE_RATES).map(([cur, info]) => (
            <button key={cur} onClick={() => setTo(cur)}
              className={cn('flex items-center justify-between p-3 rounded-2xl border-2 transition-all',
                to===cur?'border-brand-400 bg-brand-50':'border-gray-100 hover:border-gray-200')}>
              <div className="flex items-center gap-2">
                <span className="text-lg">{CURRENCIES.find(c=>c.code===cur)?.flag}</span>
                <div className="text-left">
                  <p className="text-xs font-bold text-gray-900">{cur}</p>
                  <p className="text-[9px] text-gray-400">{CURRENCIES.find(c=>c.code===cur)?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-900">₦{info.rate.toLocaleString()}</p>
                <p className={cn('text-[10px] font-bold', info.change>=0?'text-brand-600':'text-red-500')}>
                  {info.change>=0?'+':''}{info.change}%
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Converter */}
      <div className="px-4">
        <div className="bg-white rounded-3xl shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-500">Wallet Balance</span>
            <span className="text-xs font-bold text-brand-700">{formatCurrency(balance)}</span>
          </div>

          {/* From NGN */}
          <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
            <div className="flex items-center gap-2 w-24 flex-shrink-0">
              <span className="text-lg">🇳🇬</span>
              <div><p className="font-bold text-sm text-gray-900">NGN</p><p className="text-[9px] text-gray-400">Nigerian Naira</p></div>
            </div>
            <input value={amount} onChange={e=>setAmount(e.target.value)} type="number" placeholder="0.00"
              className="flex-1 bg-transparent text-xl font-display font-bold text-gray-900 outline-none text-right"/>
          </div>

          {/* Swap indicator */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100"/>
            <button type="button" onClick={() => {}} className="w-9 h-9 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center hover:bg-brand-100 transition-all">
              <ArrowLeftRight size={14} className="text-brand-600"/>
            </button>
            <div className="flex-1 h-px bg-gray-100"/>
          </div>

          {/* To selected currency */}
          <div className="bg-brand-50 rounded-2xl p-3 flex items-center gap-3">
            <div className="flex items-center gap-2 w-24 flex-shrink-0">
              <span className="text-lg">{CURRENCIES.find(c=>c.code===to)?.flag}</span>
              <div>
                <select value={to} onChange={e=>setTo(e.target.value)} className="font-bold text-sm bg-transparent outline-none cursor-pointer text-gray-900">
                  {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.code}</option>)}
                </select>
                <p className="text-[9px] text-gray-400">{CURRENCIES.find(c=>c.code===to)?.name}</p>
              </div>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xl font-display font-bold text-brand-700">
                {numAmt>0 ? formatCurrencyForeign(toAmt, to) : '0.00'}
              </p>
            </div>
          </div>

          {/* Summary */}
          {numAmt > 0 && (
            <div className="bg-gray-50 rounded-2xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Rate</span><span className="font-bold">₦{LIVE_RATES[to]?.rate?.toLocaleString()} = 1 {to}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Fee (0.5%)</span><span className="font-bold text-orange-500">-{formatCurrency(fee,'NGN',true)}</span></div>
              <div className="flex justify-between pt-1 border-t border-gray-200"><span className="font-bold">Total</span><span className="font-bold">{formatCurrency(numAmt+fee)}</span></div>
            </div>
          )}

          {/* Quick amounts */}
          <div className="grid grid-cols-4 gap-2">
            {[10000,25000,50000,100000].map(a=>(
              <button key={a} type="button" onClick={()=>setAmount(String(a))}
                className={cn('py-2.5 text-xs font-bold rounded-xl border-2 transition-all',
                  numAmt===a?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:border-gray-300')}>
                {formatCurrency(a,'NGN',true)}
              </button>
            ))}
          </div>

          <button onClick={onSubmit} disabled={loading || !numAmt || numAmt>balance} className="btn-primary w-full py-4 text-base">
            {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Converting…</div> : `Convert to ${to}`}
          </button>
        </div>

        {/* History */}
        {(transactions ?? []).length > 0 && (
          <div className="mt-5">
            <p className="section-label">Recent Exchanges</p>
            <div className="surface">
              {(transactions ?? []).slice(0,5).map(tx=>(
                <div key={tx.id} className="list-item">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight size={17} className="text-amber-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{tx.fromCurrency} → {tx.toCurrency}</p>
                    <p className="text-xs text-gray-400">{formatDate(tx.createdAt,'relative')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">-{formatCurrency(tx.fromAmount,'NGN',true)}</p>
                    <p className="text-xs font-bold text-brand-600">+{formatCurrencyForeign(tx.toAmount,tx.toCurrency)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Exchange" showBack/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={!!success} onClose={()=>setSuccess(null)}>
        {success && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-4 animate-bounce-in">
              <CheckCircle2 size={40} className="text-amber-600"/>
            </div>
            <h2 className="font-display font-bold text-xl mb-1">Converted! 🎉</h2>
            <p className="text-gray-500 text-sm mb-5">Exchange successful</p>
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-5">
              {[['Paid',formatCurrency(success.fromAmount)],['Received',formatCurrencyForeign(success.toAmount,success.toCurrency)],['Rate',`₦${LIVE_RATES[success.toCurrency]?.rate?.toLocaleString()} = 1 ${success.toCurrency}`],['Fee',formatCurrency(success.fee)]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-bold">{v}</span></div>
              ))}
            </div>
            <button onClick={()=>setSuccess(null)} className="btn-primary w-full py-3.5">Done</button>
          </div>
        )}
      </Modal>
    </>
  )
}
