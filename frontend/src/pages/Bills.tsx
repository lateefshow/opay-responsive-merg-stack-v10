import { useState } from 'react'
import { Smartphone, Database, Zap, Tv2, Wifi, Droplets, Gamepad2, ShieldCheck, ChevronRight, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import AppHeader from '@/components/layout/AppHeader'
import DeviceFrame from '@/components/layout/DeviceFrame'
import Modal from '@/components/modals/Modal'
import { billSchema, type BillInput } from '@/lib/validators'
import { useWalletStore } from '@/store/useWalletStore'
import { formatCurrency, cn, sleep } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { id:'airtime',     icon:Smartphone, label:'Airtime',     color:'bg-blue-50 text-blue-600',   desc:'Instant top-up'     },
  { id:'data',        icon:Database,   label:'Data',        color:'bg-purple-50 text-purple-600',desc:'Data bundles'       },
  { id:'electricity', icon:Zap,        label:'Electricity', color:'bg-yellow-50 text-yellow-600',desc:'Prepaid & postpaid' },
  { id:'tv',          icon:Tv2,        label:'TV / Cable',  color:'bg-red-50 text-red-600',     desc:'DSTV, GoTV, etc.'   },
  { id:'internet',    icon:Wifi,       label:'Internet',    color:'bg-indigo-50 text-indigo-600',desc:'Broadband & fiber'  },
  { id:'water',       icon:Droplets,   label:'Water',       color:'bg-cyan-50 text-cyan-600',   desc:'State water boards' },
  { id:'betting',     icon:Gamepad2,   label:'Betting',     color:'bg-orange-50 text-orange-600',desc:'Sports & casino'    },
  { id:'insurance',   icon:ShieldCheck,label:'Insurance',   color:'bg-teal-50 text-teal-600',   desc:'Life & health'      },
]

const PROVIDERS: Record<string,{name:string;id:string}[]> = {
  airtime:     [{id:'mtn',name:'MTN'},{id:'airtel',name:'Airtel'},{id:'glo',name:'Glo'},{id:'9mobile',name:'9Mobile'}],
  data:        [{id:'mtn',name:'MTN Data'},{id:'airtel',name:'Airtel Data'},{id:'glo',name:'Glo Data'}],
  electricity: [{id:'ekedc',name:'EKEDC'},{id:'ikedc',name:'IKEDC'},{id:'aedc',name:'AEDC'},{id:'phcn',name:'PHCN'}],
  tv:          [{id:'dstv',name:'DSTV'},{id:'gotv',name:'GoTV'},{id:'startimes',name:'Startimes'}],
  internet:    [{id:'spectranet',name:'Spectranet'},{id:'smile',name:'Smile'},{id:'swift',name:'Swift Networks'}],
  water:       [{id:'lwsc',name:'Lagos Water'},{id:'rswc',name:'Rivers State Water'}],
  betting:     [{id:'bet9ja',name:'Bet9ja'},{id:'sportybet',name:'SportyBet'},{id:'1xbet',name:'1xBet'}],
  insurance:   [{id:'aiico',name:'AIICO'},{id:'leadway',name:'Leadway'},{id:'nnpc',name:'NNPC Insurance'}],
}

function SuccessScreen({ bill, onDone }: { bill: BillInput; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mb-4 animate-bounce-soft">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="20" fill="#16a34a" opacity="0.1"/>
          <path d="M12 20L17 25L28 14" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="100" strokeDashoffset="0" style={{animation:'drawCheck 0.5s ease-out 0.2s both'}}/>
        </svg>
      </div>
      <h2 className="font-display font-bold text-xl text-gray-900 mb-1">Payment Successful!</h2>
      <p className="text-gray-500 text-sm mb-6">Your bill payment has been processed</p>
      <div className="w-full bg-gray-50 rounded-2xl p-4 space-y-2 text-sm mb-6">
        {[
          ['Category', bill.category],
          ['Provider', bill.provider],
          ['Account',  bill.accountRef],
          ['Amount',   formatCurrency(bill.amount)],
        ].map(([k,v]) => (
          <div key={k} className="flex justify-between">
            <span className="text-gray-500">{k}</span>
            <span className="font-semibold text-gray-900 capitalize">{v}</span>
          </div>
        ))}
      </div>
      <button onClick={onDone} className="btn-primary w-full py-3.5">Done</button>
    </div>
  )
}

export default function Bills() {
  const [selected, setSelected] = useState<string|null>(null)
  const [success, setSuccess]   = useState(false)
  const [lastBill, setLastBill] = useState<BillInput|null>(null)
  const [loading, setLoading]   = useState(false)
  const { balance } = useWalletStore()

  const { register, handleSubmit, reset, watch, formState:{ errors } } = useForm<BillInput>({
    resolver: zodResolver(billSchema),
    defaultValues: { category: selected ?? '' },
  })

  const onSubmit = async (data: BillInput) => {
    if (data.amount > balance) { toast.error('Insufficient balance'); return }
    setLoading(true)
    await sleep(1500)
    setLoading(false)
    setLastBill(data)
    setSuccess(true)
    reset()
  }

  const cat = CATEGORIES.find(c => c.id === selected)
  const providers = selected ? (PROVIDERS[selected] ?? []) : []

  const content = (
    <div className="page-container">
      <div className="px-4 pt-4 pb-3">
        <h1 className="font-display font-bold text-xl text-gray-900">Pay Bills</h1>
        <p className="text-gray-400 text-sm mt-0.5">Fast, secure bill payments</p>
      </div>

      {/* Balance pill */}
      <div className="mx-4 mb-4 bg-brand-50 rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-gray-600 font-medium">Wallet Balance</span>
        <span className="font-display font-bold text-brand-700">{formatCurrency(balance)}</span>
      </div>

      {/* Category grid */}
      {!selected ? (
        <div className="px-4">
          <p className="text-sm font-bold text-gray-500 mb-3">Select Category</p>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(({ id, icon:Icon, label, color, desc }) => (
              <button key={id} onClick={() => setSelected(id)}
                className="flex items-center gap-3 bg-white rounded-3xl shadow-card p-4 hover:shadow-card-hover transition-all active:scale-95 text-left">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0', color.split(' ')[0])}>
                  <Icon size={22} className={color.split(' ')[1]} strokeWidth={1.6}/>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4">
          {/* Back + header */}
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={16}/> Back to categories
          </button>

          <div className="flex items-center gap-3 mb-5">
            {cat && (
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', cat.color.split(' ')[0])}>
                <cat.icon size={22} className={cat.color.split(' ')[1]} strokeWidth={1.6}/>
              </div>
            )}
            <div>
              <h2 className="font-display font-bold text-gray-900">{cat?.label}</h2>
              <p className="text-xs text-gray-400">{cat?.desc}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register('category')} value={selected}/>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Provider</label>
              <select {...register('provider')} className="input-field bg-white">
                <option value="">Select provider</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.provider && <p className="text-red-500 text-xs mt-1">{errors.provider.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                {selected==='airtime'||selected==='data' ? 'Phone Number' :
                 selected==='tv' ? 'Smart Card / IUC Number' :
                 selected==='electricity' ? 'Meter Number' : 'Account Reference'}
              </label>
              <input {...register('accountRef')} placeholder="Enter reference" className="input-field"/>
              {errors.accountRef && <p className="text-red-500 text-xs mt-1">{errors.accountRef.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₦)</label>
              <input {...register('amount')} type="number" placeholder="0.00" className="input-field text-lg font-bold"/>
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>

            {/* Summary */}
            {watch('amount') && Number(watch('amount')) > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-bold">{formatCurrency(Number(watch('amount')))}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Fee</span><span className="font-bold text-brand-600">Free</span></div>
                <div className="border-t border-gray-200 pt-1 flex justify-between"><span className="font-bold">Total</span><span className="font-bold">{formatCurrency(Number(watch('amount')))}</span></div>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-base">
              {loading ? <div className="flex items-center justify-center gap-2"><div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Processing...</div> : 'Pay Now'}
            </button>
          </form>
        </div>
      )}

      {/* Recent bills */}
      {!selected && (
        <div className="px-4 mt-6">
          <p className="font-display font-bold text-gray-900 mb-3">Recent Bills</p>
          <div className="bg-white rounded-3xl shadow-card overflow-hidden">
            {[
              { label:'MTN Airtime', sub:'08012345678', amount:2000, time:'2h ago', icon:Smartphone, color:'text-blue-600 bg-blue-50'   },
              { label:'DSTV Compact',sub:'1234567890',  amount:7900, time:'1d ago', icon:Tv2,        color:'text-red-600 bg-red-50'     },
              { label:'EKEDC Prepaid',sub:'45000123456',amount:5000, time:'3d ago', icon:Zap,        color:'text-yellow-600 bg-yellow-50'},
            ].map(({ label, sub, amount, time, icon:Icon, color }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', color.split(' ')[1])}>
                  <Icon size={18} className={color.split(' ')[0]} strokeWidth={1.8}/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400">{sub} · {time}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">-{formatCurrency(amount)}</p>
                  <button className="text-xs text-brand-600 font-semibold hover:underline">Repeat</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      <AppHeader title="Pay Bills" showBack={!!selected}/>
      <DeviceFrame>{content}</DeviceFrame>
      <Modal isOpen={success} onClose={() => setSuccess(false)}>
        {lastBill && <SuccessScreen bill={lastBill} onDone={() => setSuccess(false)}/>}
      </Modal>
    </>
  )
}
