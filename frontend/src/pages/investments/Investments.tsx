import { useState } from 'react'
import { TrendingUp, Plus, Clock, DollarSign, BarChart3, ChevronRight, Info, CheckCircle2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useInvestmentStore } from '@/store/useInvestmentStore'
import { useWalletStore } from '@/store/useWalletStore'
import { investmentSchema, type InvestmentInput } from '@/lib/validators'
import { formatCurrency, formatDate, cn, sleep, percentage, addDays, addMonths } from '@/lib/utils'
import type { InvestmentPlan } from '@/types'
import toast from 'react-hot-toast'

const PRODUCTS = [
  { type:'money_market'  as const, name:'Money Market',    rate:12.5, minAmount:5000,   tenure:30,  tenureUnit:'days'   as const, risk:'Low',    color:'from-brand-600 to-brand-700',   icon:DollarSign,  desc:'Park idle cash and earn daily returns. Withdraw anytime.' },
  { type:'treasury_bill' as const, name:'Treasury Bills',  rate:19.2, minAmount:50000,  tenure:91,  tenureUnit:'days'   as const, risk:'Low',    color:'from-blue-600 to-indigo-700',   icon:BarChart3,   desc:'Government-backed securities. Highest short-term returns.' },
  { type:'fixed_income'  as const, name:'Fixed Income',    rate:15.5, minAmount:10000,  tenure:6,   tenureUnit:'months' as const, risk:'Low',    color:'from-teal-600 to-teal-700',     icon:Clock,       desc:'Lock in a fixed rate for 6–12 months with full capital protection.' },
  { type:'mutual_fund'   as const, name:'Mutual Funds',    rate:22.0, minAmount:5000,   tenure:12,  tenureUnit:'months' as const, risk:'Medium', color:'from-purple-600 to-violet-700', icon:TrendingUp,  desc:'Professionally managed diversified portfolio for higher returns.' },
]

function InvestmentCard({ plan, onLiquidate }: { plan: InvestmentPlan; onLiquidate: ()=>void }) {
  const product = PRODUCTS.find(p => p.type === plan.type)
  const pct = percentage(plan.returnAmount, plan.principalAmount)
  const isProfit = plan.returnAmount > 0
  return (
    <div className={cn('rounded-3xl p-5 text-white relative overflow-hidden shadow-float', `bg-gradient-to-br ${product?.color ?? 'from-gray-600 to-gray-700'}`)}>
      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
      <div className="absolute -right-2 top-16 w-28 h-28 rounded-full border-[14px] border-white/10"/>
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-semibold">{plan.name}</p>
            <p className="font-display font-bold text-xl">{formatCurrency(plan.currentValue,'NGN',true)}</p>
          </div>
          <span className={cn('badge text-xs', plan.status==='active'?'bg-white/20 text-white':'bg-white/10 text-white/70')}>{plan.status}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4 text-center">
          <div><p className="text-white/60 text-[10px] font-semibold">Principal</p><p className="text-white font-bold text-sm">{formatCurrency(plan.principalAmount,'NGN',true)}</p></div>
          <div><p className="text-white/60 text-[10px] font-semibold">Returns</p><p className="text-green-300 font-bold text-sm">+{formatCurrency(plan.returnAmount,'NGN',true)}</p></div>
          <div><p className="text-white/60 text-[10px] font-semibold">Rate</p><p className="text-white font-bold text-sm">{plan.returnRate}% p.a.</p></div>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-white rounded-full transition-all" style={{width:`${Math.min(pct*2,100)}%`}}/>
        </div>
        <div className="flex items-center justify-between text-xs text-white/60">
          <span>Matures {formatDate(plan.maturityDate,'short')}</span>
          {plan.status==='active' && (
            <button onClick={onLiquidate} className="text-red-300 font-bold hover:text-red-200">Liquidate</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Investments() {
  const { investments, addInvestment, liquidate, totalValue, totalReturns } = useInvestmentStore()
  const { balance, setBalance } = useWalletStore()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0]|null>(null)
  const [step, setStep] = useState<1|2>(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<InvestmentPlan|null>(null)

  const { register, handleSubmit, watch, reset, formState:{errors} } = useForm<InvestmentInput>({
    resolver: zodResolver(investmentSchema),
    defaultValues: { type:'money_market', tenure:30 },
  })

  const onCreate = async (data: InvestmentInput) => {
    if (data.amount > balance) { toast.error('Insufficient wallet balance'); return }
    const p = PRODUCTS.find(x => x.type===data.type)!
    setLoading(true)
    await sleep(1500)
    const returnRate = p.rate
    const returnAmt = (data.amount * returnRate/100) * (data.tenure / (p.tenureUnit==='months' ? 12 : 365))
    const maturity = p.tenureUnit==='months' ? addMonths(new Date(), data.tenure) : addDays(new Date(), data.tenure)
    const plan: InvestmentPlan = {
      id: crypto.randomUUID(), userId:'', type:data.type,
      name: p.name, principalAmount: data.amount,
      currentValue: data.amount + returnAmt, returnRate,
      returnAmount: returnAmt, returnPercent: (returnAmt/data.amount)*100,
      tenure: data.tenure, tenureUnit: p.tenureUnit,
      maturityDate: maturity.toISOString(), status:'active',
      createdAt: new Date().toISOString(),
    }
    addInvestment(plan)
    setBalance(balance - data.amount)
    toast.success(`${p.name} investment of ${formatCurrency(data.amount)} created!`)
    setSuccess(plan); reset(); setShowCreate(false); setSelectedProduct(null); setStep(1); setLoading(false)
  }

  const activeInvestments = (investments ?? []).filter(i=>i.status==='active')
  const totalVal = totalValue()
  const totalRet = totalReturns()

  const content = (
    <div className="page-container">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div><h1 className="font-display font-bold text-xl text-gray-900">Investments</h1><p className="text-gray-400 text-sm mt-0.5">Grow your wealth</p></div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-2xl hover:bg-brand-700 transition-all shadow-float-green active:scale-95">
          <Plus size={15}/> Invest
        </button>
      </div>

      {/* Portfolio summary */}
      <div className="mx-4 mb-4 bg-investment-gradient rounded-3xl p-5 relative overflow-hidden shadow-premium">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
        <div className="relative z-10">
          <p className="text-white/60 text-xs font-semibold mb-1">Portfolio Value</p>
          <p className="font-display font-bold text-white text-3xl mb-3">{formatCurrency(totalVal)}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-[10px] font-semibold mb-0.5">Total Returns</p>
              <p className="text-green-400 font-display font-bold text-lg">+{formatCurrency(totalRet,'NGN',true)}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-3">
              <p className="text-white/60 text-[10px] font-semibold mb-0.5">Active Plans</p>
              <p className="text-white font-display font-bold text-lg">{activeInvestments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 mb-5">
        <p className="font-display font-bold text-gray-900 mb-3">Available Products</p>
        <div className="grid grid-cols-2 gap-3">
          {PRODUCTS.map(p => {
            const Icon = p.icon
            return (
              <button key={p.type} onClick={() => { setSelectedProduct(p); setShowCreate(true) }}
                className="bg-white rounded-3xl shadow-card p-4 text-left hover:shadow-card-hover transition-all active:scale-95">
                <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-gradient-to-br', p.color)}>
                  <Icon size={18} className="text-white" strokeWidth={1.8}/>
                </div>
                <p className="font-bold text-sm text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5 mb-2">{p.desc.slice(0,50)}…</p>
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-brand-600">{p.rate}% p.a.</span>
                  <span className={cn('badge text-[10px]', p.risk==='Low'?'badge-green':'badge-gold')}>{p.risk} risk</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active investments */}
      <div className="px-4">
        <p className="font-display font-bold text-gray-900 mb-3">My Investments ({activeInvestments.length})</p>
        {activeInvestments.length===0 ? (
          <div className="text-center py-12 bg-white rounded-3xl shadow-card">
            <TrendingUp size={40} className="mx-auto mb-3 text-gray-200"/>
            <p className="font-bold text-gray-500">No active investments</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Start with as little as ₦5,000</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary px-6 py-2.5 text-sm">Start Investing</button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInvestments.map(plan => (
              <InvestmentCard key={plan.id} plan={plan} onLiquidate={() => { liquidate(plan.id); toast.success('Investment liquidated'); }}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <>
      <AppHeader title="Investments"/>
      <DeviceFrame>{content}</DeviceFrame>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setSelectedProduct(null); setStep(1) }} title="New Investment">
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          {step===1 && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Choose Product</label>
                <div className="space-y-2">
                  {PRODUCTS.map(p => {
                    const Icon = p.icon
                    return (
                      <label key={p.type} className={cn('flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all',
                        watch('type')===p.type?'border-brand-500 bg-brand-50':'border-gray-100 hover:border-gray-200')}>
                        <input type="radio" {...register('type')} value={p.type} className="sr-only"/>
                        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br flex-shrink-0',p.color)}><Icon size={16} className="text-white"/></div>
                        <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-900">{p.name}</p><p className="text-xs text-gray-400">From {formatCurrency(p.minAmount,'NGN',true)} · {p.tenure} {p.tenureUnit}</p></div>
                        <span className="font-display font-bold text-brand-600 text-sm">{p.rate}%</span>
                      </label>
                    )
                  })}
                </div>
              </div>
              <button type="button" onClick={() => setStep(2)} className="btn-primary w-full py-3.5">Continue</button>
            </>
          )}
          {step===2 && (
            <>
              <div className="bg-brand-50 rounded-2xl px-4 py-3 flex justify-between"><span className="text-sm text-gray-600">Wallet Balance</span><span className="font-bold text-brand-700">{formatCurrency(balance)}</span></div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
                <input {...register('amount')} type="number" placeholder="0.00" className="input-field text-xl font-bold"/>
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tenure ({PRODUCTS.find(p=>p.type===watch('type'))?.tenureUnit})</label>
                <input {...register('tenure')} type="number" placeholder="30" className="input-field"/>
                {errors.tenure && <p className="text-red-500 text-xs mt-1">{errors.tenure.message}</p>}
              </div>
              {watch('amount') && Number(watch('amount'))>0 && (
                <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 text-sm">
                  {(() => {
                    const p = PRODUCTS.find(x=>x.type===watch('type'))!
                    const amt = Number(watch('amount'))
                    const tenure = Number(watch('tenure'))||p.tenure
                    const ret = (amt*p.rate/100)*(tenure/(p.tenureUnit==='months'?12:365))
                    return <>
                      <div className="flex justify-between"><span className="text-gray-500">Returns</span><span className="font-bold text-brand-600">+{formatCurrency(ret,'NGN',true)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Maturity Value</span><span className="font-bold">{formatCurrency(amt+ret)}</span></div>
                    </>
                  })()}
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={()=>setStep(1)} className="btn-secondary flex-1 py-3.5">Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3.5">
                  {loading?<div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Investing…</div>:'Confirm'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* Success modal */}
      <Modal isOpen={!!success} onClose={() => setSuccess(null)}>
        {success && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4 animate-bounce-in"><CheckCircle2 size={40} className="text-brand-600"/></div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Investment Created! 🎉</h2>
            <p className="text-gray-500 text-sm mb-5">Your {success.name} investment is now active</p>
            <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-5">
              {[['Amount',formatCurrency(success.principalAmount)],['Expected Return','+'+formatCurrency(success.returnAmount,'NGN',true)],['Maturity',formatDate(success.maturityDate,'short')]].map(([k,v])=>(
                <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-bold text-gray-900">{v}</span></div>
              ))}
            </div>
            <button onClick={() => setSuccess(null)} className="btn-primary w-full py-3.5">Done</button>
          </div>
        )}
      </Modal>
    </>
  )
}
