import { useState } from 'react'
import { Banknote, Clock, CheckCircle2, AlertTriangle, ChevronRight, Info, Calculator } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { useLoanStore } from '@/store/useLoanStore'
import { useWalletStore } from '@/store/useWalletStore'
import { loanSchema, type LoanInput } from '@/lib/validators'
import { formatCurrency, formatDate, calcLoanRepayment, cn, sleep, addMonths } from '@/lib/utils'
import type { LoanApplication } from '@/types'
import toast from 'react-hot-toast'

const LOAN_PRODUCTS = [
  { id:'quickloan',    name:'QuickLoan',    desc:'Instant access up to ₦100K',  minAmount:5000,   maxAmount:100000,  rate:4.0,  maxTenure:3,  tenureUnit:'months' as const, requiresKYC:1, color:'from-brand-600 to-brand-700',   icon:'⚡' },
  { id:'salaryadvance',name:'SalaryAdvance',desc:'Get paid before payday',       minAmount:10000,  maxAmount:500000,  rate:2.5,  maxTenure:1,  tenureUnit:'months' as const, requiresKYC:2, color:'from-blue-600 to-indigo-700',   icon:'💼' },
  { id:'businessloan', name:'Business Loan',desc:'Grow your business fast',      minAmount:50000,  maxAmount:2000000, rate:3.5,  maxTenure:12, tenureUnit:'months' as const, requiresKYC:3, color:'from-teal-600 to-teal-700',     icon:'🏢' },
  { id:'emergencyloan',name:'Emergency',    desc:'Urgent funds in 5 minutes',    minAmount:2000,   maxAmount:50000,   rate:5.0,  maxTenure:1,  tenureUnit:'months' as const, requiresKYC:1, color:'from-red-500 to-rose-600',      icon:'🚨' },
]

function RepaymentSchedule({ amount, rate, tenure }: { amount:number; rate:number; tenure:number }) {
  const { monthly, total, interest } = calcLoanRepayment(amount, rate, tenure)
  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
      <p className="font-bold text-gray-900 mb-2">Repayment Summary</p>
      {[['Monthly Payment',formatCurrency(monthly)],['Total Repayment',formatCurrency(total)],['Interest ('+rate+'%/mo)',formatCurrency(interest)]].map(([k,v])=>(
        <div key={k} className="flex justify-between"><span className="text-gray-500">{k}</span><span className="font-bold text-gray-900">{v}</span></div>
      ))}
    </div>
  )
}

export default function Loans() {
  const { applications, applyForLoan, repay, activeLoan } = useLoanStore()
  const { balance, setBalance } = useWalletStore()
  const [showApply, setShowApply] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<typeof LOAN_PRODUCTS[0]|null>(null)
  const [step, setStep] = useState<1|2|3>(1)
  const [loading, setLoading] = useState(false)
  const active = activeLoan()

  const { register, handleSubmit, watch, reset, formState:{errors} } = useForm<LoanInput>({
    resolver: zodResolver(loanSchema),
    defaultValues: { productId:'quickloan', amount:50000, tenure:3, purpose:'' },
  })

  const onApply = async (data: LoanInput) => {
    setLoading(true)
    await sleep(2000)
    const p = LOAN_PRODUCTS.find(x => x.id===data.productId)!
    const { monthly, total, interest } = calcLoanRepayment(data.amount, p.rate, data.tenure)
    const app: LoanApplication = {
      id:crypto.randomUUID(), userId:'', productId:data.productId,
      amount: data.amount, tenure: data.tenure,
      monthlyRepayment:monthly, totalRepayment:total, interestAmount:interest,
      status:'approved', disbursedAt:new Date().toISOString(),
      dueDate: addMonths(new Date(), data.tenure).toISOString(),
      createdAt:new Date().toISOString(),
    }
    applyForLoan(app)
    setBalance(balance + data.amount)
    toast.success(`₦${data.amount.toLocaleString()} disbursed to your wallet!`)
    reset(); setShowApply(false); setSelectedProduct(null); setStep(1); setLoading(false)
  }

  const amount = Number(watch('amount'))||0
  const tenure = Number(watch('tenure'))||1
  const prod = LOAN_PRODUCTS.find(p=>p.id===watch('productId'))
  const rate = prod?.rate ?? 4

  const content = (
    <div className="page-container">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div><h1 className="font-display font-bold text-xl text-gray-900">Loans</h1><p className="text-gray-400 text-sm mt-0.5">Fast, flexible credit</p></div>
      </div>

      {/* Active loan banner */}
      {active && (
        <div className={cn('mx-4 mb-4 bg-gradient-to-br rounded-3xl p-5 relative overflow-hidden text-white shadow-float',
          active.status==='overdue'?'from-red-600 to-rose-700':'from-purple-600 to-violet-700')}>
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border-[20px] border-white/10"/>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div><p className="text-white/70 text-xs font-semibold">Active Loan</p><p className="font-display font-bold text-2xl">{formatCurrency(active.totalRepayment)}</p></div>
              {active.status==='overdue' && <AlertTriangle size={24} className="text-red-300"/>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-[10px]">Monthly</p><p className="text-white font-bold">{formatCurrency(active.monthlyRepayment,'NGN',true)}</p></div>
              <div className="bg-white/10 rounded-xl p-3"><p className="text-white/60 text-[10px]">Due Date</p><p className="text-white font-bold">{formatDate(active.dueDate!,'short')}</p></div>
            </div>
            <button onClick={() => { repay(active.id, active.monthlyRepayment); setBalance(balance-active.monthlyRepayment); toast.success('Payment made!') }}
              className="bg-white text-purple-700 font-bold text-sm w-full py-2.5 rounded-2xl hover:bg-purple-50 transition-colors active:scale-95">
              Make Payment
            </button>
          </div>
        </div>
      )}

      {/* Credit score */}
      <div className="mx-4 mb-4 bg-white rounded-3xl shadow-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 mb-0.5">Credit Score</p>
            <p className="font-display font-bold text-3xl text-gray-900">742</p>
            <p className="text-xs font-semibold text-brand-600">Excellent 🌟</p>
          </div>
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#16a34a" strokeWidth="3" strokeDasharray="74.2 25.8" strokeLinecap="round"/>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-brand-600">74%</span></div>
          </div>
        </div>
        <div className="mt-3 progress-bar"><div className="progress-fill" style={{'--progress':'74%'} as React.CSSProperties}/></div>
      </div>

      {/* Loan products */}
      <div className="px-4 mb-5">
        <p className="font-display font-bold text-gray-900 mb-3">Loan Products</p>
        <div className="space-y-3">
          {LOAN_PRODUCTS.map(p => (
            <button key={p.id} onClick={() => { setSelectedProduct(p); setShowApply(true) }} disabled={!!active}
              className="w-full bg-white rounded-3xl shadow-card p-4 flex items-center gap-4 hover:shadow-card-hover transition-all active:scale-[0.98] text-left disabled:opacity-50 disabled:cursor-not-allowed">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 bg-gradient-to-br', p.color)}>
                {p.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.desc}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="badge badge-green text-[10px]">Up to {formatCurrency(p.maxAmount,'NGN',true)}</span>
                  <span className="text-xs text-gray-400">{p.rate}%/mo</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-300 flex-shrink-0"/>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      {(applications ?? []).length>0 && (
        <div className="px-4">
          <p className="font-display font-bold text-gray-900 mb-3">Loan History</p>
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {(applications ?? []).slice(0,5).map(a => (
              <div key={a.id} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center flex-shrink-0"><Banknote size={18} className="text-purple-600"/></div>
                <div className="flex-1"><p className="text-sm font-bold text-gray-900">{formatCurrency(a.amount)}</p><p className="text-xs text-gray-400">{formatDate(a.createdAt,'relative')}</p></div>
                <span className={cn('badge text-[10px]', a.status==='repaid'?'badge-green':a.status==='active'?'badge-blue':'badge-gray')}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Loans"/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={showApply} onClose={() => { setShowApply(false); setStep(1) }} title="Apply for Loan">
        <form onSubmit={handleSubmit(onApply)} className="space-y-4">
          <input type="hidden" {...register('productId')} value={selectedProduct?.id ?? 'quickloan'}/>
          {selectedProduct && (
            <div className={cn('rounded-2xl p-4 text-white text-center bg-gradient-to-br', selectedProduct.color)}>
              <p className="text-3xl mb-1">{selectedProduct.icon}</p>
              <p className="font-bold">{selectedProduct.name}</p>
              <p className="text-white/70 text-xs">{selectedProduct.rate}% per month interest</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Loan Amount (₦)</label>
            <input {...register('amount')} type="number" placeholder="50000" className="input-field text-xl font-bold"/>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Tenure (months)</label>
            <div className="flex gap-2">
              {[1,2,3,6,12].filter(t => t<=(selectedProduct?.maxTenure??3)).map(t=>(
                <button key={t} type="button" onClick={()=>{ /* handled by register */ }}
                  className={cn('flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all',
                    Number(watch('tenure'))===t?'border-brand-500 bg-brand-50 text-brand-700':'border-gray-200 text-gray-600 hover:border-gray-300')}>
                  {t}mo
                </button>
              ))}
              <input {...register('tenure')} type="hidden"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Purpose</label>
            <textarea {...register('purpose')} placeholder="What do you need this loan for?" className="input-field resize-none" rows={3}/>
            {errors.purpose && <p className="text-red-500 text-xs mt-1">{errors.purpose.message}</p>}
          </div>
          {amount>0 && <RepaymentSchedule amount={amount} rate={rate} tenure={tenure}/>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base">
            {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Processing…</div> : 'Apply Now'}
          </button>
        </form>
      </Modal>
    </>
  )
}
